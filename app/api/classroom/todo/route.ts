import { authOptions } from "@/lib/authOptions";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Authenticate the user
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return new Response(
                JSON.stringify({ error: "Unauthorized. Please log in first." }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const user = await prisma.user.findUnique({
          where: {
            email: session.user.email,
          },
          select: {
            id: true,
          },
        });

        if (!user) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        // Find all classrooms where the user is a student
        const studentClassrooms = await prisma.classroomMember.findMany({
            where: {
                userId: user.id,
                role: "student",
            },
            select: {
                classroomId: true,
            },
        });

        const classroomIds = studentClassrooms.map(classroom => classroom.classroomId);

        // Find all assignments (posts of type 'assignment') in those classrooms
        const assignments = await prisma.post.findMany({
            where: {
                classroomId: {
                    in: classroomIds,
                },
                type: "assignment",
            },
            include: {
                classroom: {
                    select: {
                        name: true,
                    },
                },
                author: {
                    select: {
                        name: true,
                    },
                },
                submissions: {
                    where: {
                        studentId: user.id,
                    },
                    select: {
                        id: true,
                        submittedAt: true,
                        studentId: true
                    }
                },
            },
            orderBy: {
                dueDate: 'asc',
            },
        });

        // Process assignments to include status information
        const formattedAssignments = assignments.map(assignment => {
            const hasSubmission = assignment.submissions.length > 0;
            const submission = hasSubmission ? assignment.submissions[0] : null;
            
            // Determine submission status
            let status: "assigned" | "missing" | "done" = "assigned";
            let isLate = false;
            
            if (hasSubmission) { // Assignment has been submitted, status is 'done'
                status = "done";
                if (assignment.dueDate && submission) { // Check if submission was late
                    isLate = new Date(submission.submittedAt) > new Date(assignment.dueDate);
                }
            } else if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
                status = "missing"; // Assignment is past due date and not submitted
            }

            return {
                id: assignment.id,
                title: assignment.title,
                dueDate: assignment.dueDate,
                classroomName: assignment.classroom.name,
                authorName: assignment.author.name,
                classroomId: assignment.classroomId,
                status: status,
                submitted: hasSubmission,
                submittedAt: submission?.submittedAt.toISOString() || null,
                isLate: isLate
            };
        });

        return new Response(
            JSON.stringify({ assignments: formattedAssignments }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error fetching student assignments:", error);
        return new Response(
            JSON.stringify({ error: "An unexpected error occurred. Please try again later." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
