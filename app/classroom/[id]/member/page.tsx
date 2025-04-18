"use client";


import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  UserPlus,
  X,
  Plus,
  Send,
  Trash2,
  Copy,
  QrCode,
  Mail,
} from "lucide-react";

import {
  CLASSROOM_MEMBER_API,
  CLASSROOM_BY_ID_API,
  AVATAR_IMAGE,
  SEND_INVITATION,
} from "@/lib/api_routes";
import RoleBased from "@/app/components/RoleBased";

type InvitePerson = {
  email: string;
  role: "student" | "co-teacher" | "teacher";
  id: string;
};

type InvitationResponseItem = {
  email: string;
  role: "student" | "co-teacher" | "teacher";
  message: string;
};


export default function PeoplePage() {
  const [members, setMembers] = useState<
    {
      id: string;
      name: string;
      email: string;
      role: string;
      image?: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "email">("code");
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<string>("");
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
    visible: boolean;
  } | null>(null);

  // Default invite state - use this to reset
  const defaultInvitePerson = useMemo<InvitePerson>(() => ({
    email: "",
    role: "student",
    id: "1",
  }), []);
  

  // State for people to invite
  const [invitePeople, setInvitePeople] = useState<InvitePerson[]>([
    defaultInvitePerson, // rewrite to Reset the invitation form when dialog closes
  ]);

  const params = useParams();
  const classroomId = params?.id as string;

  // classroom code
  const [classroomCode, setClassCode] = useState<string>("");

  // rewrite to Reset the invitation form when dialog closes; actual code
  useEffect(() => {
    if (!isInviteDialogOpen) {
      setInvitePeople([{ ...defaultInvitePerson }]);
    }
  }, [isInviteDialogOpen, defaultInvitePerson]);

  useEffect(() => {
    if (session?.user?.email && members.length > 0) {
      const currentUser = members.find(member => member.email === session?.user?.email);
      if (currentUser) {
        setUserRole(currentUser.role);
      }
    }
  }, [session, members]);

  useEffect(() => {
    async function fetchMembers() {
      if (!classroomId) {
        setError("Classroom ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(CLASSROOM_MEMBER_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classroomId }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch classroom members");
        }

        const data = await response.json();
        setMembers(data.members);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchClassroomCode() {
      if (!classroomId) {
        setError("Classroom ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(CLASSROOM_BY_ID_API.replace("[id]", classroomId), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch classroom");
        }

        const data = await response.json();
        setClassCode(data.code);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchClassroomCode();
    fetchMembers();
  }, [classroomId]);

  const handleEmailChange = (id: string, email: string) => {
    setInvitePeople(
      invitePeople.map((person) =>
        person.id === id ? { ...person, email } : person
      )
    );
  };

  const handleRoleChange = (
    id: string,
    role: "student" | "co-teacher" | "teacher"
  ) => {
    setInvitePeople(
      invitePeople.map((person) =>
        person.id === id ? { ...person, role } : person
      )
    );
  };

  const addPersonField = () => {
    const newId = Date.now().toString();
    setInvitePeople([
      ...invitePeople,
      { email: "", role: "student", id: newId },
    ]);

    // Auto-hide notification after 2 seconds
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  const removePersonField = (id: string) => {
    if (invitePeople.length > 1) {
      setInvitePeople(invitePeople.filter((person) => person.id !== id));
    }
  };

  const validateEmails = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = invitePeople.filter(
      (person) => person.email.trim() !== "" && !emailRegex.test(person.email)
    );

    if (invalidEmails.length > 0) {
      setNotification({
        title: "Invalid email(s)",
        message: "Please enter valid email addresses",
        type: "error",
        visible: true,
      });
      return false;
    }

    // Check for empty emails
    const emptyEmails = invitePeople.filter(
      (person) => person.email.trim() === ""
    );
    if (emptyEmails.length === invitePeople.length) {
      setNotification({
        title: "No emails entered",
        message: "Please enter at least one email address",
        type: "error",
        visible: true,
      });
      return false;
    }

    return true;
  };

  const handleSendInvites = async () => {
    if (activeTab === "email" && !validateEmails()) return;

    setIsInviting(true);

    // Filter out blank emails
    const peopleToInvite = invitePeople.filter(
      (person) => person.email.trim() !== ""
    );

    try {
      const response = await fetch(SEND_INVITATION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          invitations: peopleToInvite.map(({ email, role }) => ({
            email,
            role,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send invitations");
      }

      const data = await response.json();
      const invited = data.result.filter((r: InvitationResponseItem) => r.message === "Invitation sent");
      const skipped = data.result.filter((r: InvitationResponseItem) => r.message !== "Invitation sent");

      setNotification({
        title: "Invitations Processed",
        message: `${invited.length} sent, ${skipped.length} skipped`,
        type: "success",
        visible: true,
      });

      // Optional: show individual messages per invite
      console.table(data.result);

    } catch (err) {
      setNotification({
        title: "Error",
        message: "Failed to send invitations",
        type: "error",
        visible: true,
      });
      console.error(err);
    } finally {
      setIsInviting(false);
      setIsInviteDialogOpen(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification({
      title: "Copied to clipboard",
      message: "The classroom code has been copied to your clipboard",
      type: "success",
      visible: true,
    });
    // Auto-hide notification after 2 seconds
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading members...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  // Separate teachers and students
  const teachers = members.filter(
    (member) => member.role === "teacher" || member.role === "co-teacher"
  );
  const students = members.filter((member) => member.role === "student");

  return (
    <>
      {notification && notification.visible && (
        <Alert
          className={`fixed top-4 right-4 w-96 z-50 ${notification.type === "success"
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
            }`}
        >
          <AlertTitle className="flex justify-between">
            {notification.title}
            <button onClick={() => setNotification(null)}>
              <X className="h-4 w-4" />
            </button>
          </AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex h-screen bg-background p-6">
        <div className="w-full mx-auto space-y-6">
          {/* Teacher Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Teachers</h2>
            {teachers.length > 0 ? (
              <div className="space-y-2">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg"
                  >
                    <Avatar>
                      <AvatarImage
                        src={teacher.image || AVATAR_IMAGE}
                        alt={teacher.name}
                      />
                      <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{teacher.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {teacher.role === "co-teacher"
                          ? "Co-Teacher"
                          : "Teacher"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No teachers in this classroom.
              </p>
            )}
          </div>

          {/* Students Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Students</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {students.length} Students
                </span>
                <RoleBased allowedRoles={["teacher", "co-teacher"]} userRole={userRole}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-purple-600 border-purple-600 hover:bg-purple-50"
                    onClick={() => setIsInviteDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add People</span>
                  </Button>
                </RoleBased>
              </div>
            </div>
            {students.length > 0 ? (
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg"
                  >
                    <Avatar>
                      <AvatarImage
                        src={student.image || AVATAR_IMAGE}
                        alt={student.name}
                      />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{student.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No students in this classroom.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add People Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Add People</DialogTitle>
            </div>
            <DialogDescription className="flex justify-between">
              Invite people to join your classroom
              {activeTab === "email" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addPersonField}
                  className="rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="">
            <div className="flex border-b mb-6">
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 px-4 py-2 ${activeTab === "code"
                  ? "border-b-2 border-purple-600 text-purple-600 font-semibold"
                  : "text-muted-foreground"
                  }`}
              >
                <QrCode className="h-4 w-4" />
                <span>Classroom Code</span>
              </button>
              <button
                onClick={() => setActiveTab("email")}
                className={`flex items-center gap-2 px-4 py-2 ${activeTab === "email"
                  ? "border-b-2 border-purple-600 text-purple-600 font-semibold"
                  : "text-muted-foreground"
                  }`}
              >
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </button>
            </div>

            {activeTab === "code" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Classroom Code
                  </label>
                  <div className="flex">
                    <Input
                      value={classroomCode}
                      readOnly
                      className="font-mono text-lg"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={() => copyToClipboard(classroomCode)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <h3 className="font-medium mb-2">How students join:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    <li>Students go to the join page</li>
                    <li>They enter the classroom code</li>
                    <li>
                      You&apos;ll receive a notification to approve their request
                    </li>
                    <li>Once approved, they&apos;ll be added to your classroom</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                  {invitePeople.map((person) => (
                    <div
                      key={person.id}
                      className="flex gap-2 items-center p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1.5 block">
                          Email
                        </label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={person.email}
                          onChange={(e) =>
                            handleEmailChange(person.id, e.target.value)
                          }
                        />
                      </div>
                      <div className="w-32">
                        <label className="text-sm font-medium mb-1.5 block">
                          Role
                        </label>
                        <select
                          className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                          value={person.role}
                          onChange={(e) =>
                            handleRoleChange(
                              person.id,
                              e.target.value as "student" | "co-teacher"
                            )
                          }
                        >
                          <option value="student">Student</option>
                          <option value="co-teacher">Co-teacher</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      </div>
                      {invitePeople.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-6"
                          onClick={() => removePersonField(person.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeTab === "email" && (
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4"
              disabled={isInviting}
              onClick={handleSendInvites}
            >
              {isInviting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Invitations
                </span>
              )}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

