"use client";

import { useParams, useSearchParams } from "next/navigation";
import { FileText, Bold, Italic, Underline, List, Link, UserPen, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// MUI X Date Picker imports for DateTimePicker
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from "dayjs";

export default function CreateClasswork() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classroomId = params?.id as string;
  const type = searchParams?.get("type") || "Assignment";
  const [dueDate, setDueDate] = useState<dayjs.Dayjs | null>(null);

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [points, setPoints] = useState(100);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    console.log("Classroom ID:", classroomId);
  }, [classroomId]);

  const handleCreateClick = async () => {
    if (!classroomId || !title) {
      alert("Classroom ID and title are required.");
      return;
    }

    setLoading(true);

    try {
      // Determine the API endpoint based on type
      let apiEndpoint = "/api/classroom/posts/assignment/create";
      const requestBody: { classroomId: string; title: string; content: string; dueDate?: string | null } = {
        classroomId,
        title,
        content: instructions,
      };

      if (type === "Assignment") {
        requestBody.dueDate = dueDate ? dueDate.toISOString() : null;
      } else if (type === "Material") {
        apiEndpoint = "/api/classroom/posts/material/create"; // Change endpoint for Material
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ${type.toLowerCase()}.`);
      }

      // Redirect to classwork page
      router.push(`/classroom/${classroomId}/classwork`);
    } catch (error) {
      console.error(`Error creating ${type.toLowerCase()}:`, error);
      alert(`Error creating ${type.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="w-full bg-white shadow-sm p-4 flex items-center border-b">
        <div className="flex items-center text-black-600 space-x-4">
          <FileText className="text-purple-600 ml-3" />
          <h2 className="text-lg">{type}</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button className="bg-purple-600 text-white mr-3" onClick={handleCreateClick} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Assignment form */}
        <div className="flex-1 p-4">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <input
              type="text"
              placeholder="Title"
              className="w-full border-b border-gray-300 py-2 mb-4 focus:outline-none focus:border-purple-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Instructions (optional)"
              className="w-full min-h-32 py-2 mb-4 focus:outline-none"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />

            {/* <div className="flex space-x-4 border-t pt-4">
              <button>
                <Bold className="text-black w-5 h-5 rounded hover:bg-gray-200" />
              </button>
              <button>
                <Italic className="text-black w-5 h-5 rounded hover:bg-gray-200" />
              </button>
              <button>
                <Underline className="text-black w-5 h-5 rounded hover:bg-gray-200" />
              </button>
              <button>
                <List className="text-black w-5 h-5 rounded hover:bg-gray-200" />
              </button>
              <button>
                <Link className="text-black w-5 h-5 rounded hover:bg-gray-200" />
              </button>
            </div> */}
          </div>
        </div>

        {/* Settings */}
        <div className="w-full md:w-80 p-4 border-t md:border-t-0 md:border-l bg-white">
          <div className="space-y-6">
            {/* <div>
              <p className="text-sm text-black-500 mb-2">Assign to</p>
              <div className="relative">
                <div className="w-full p-2 border rounded-md flex items-center justify-between">
                  <div className="flex items-center text-black-500">
                    <UserPen className="w-5 h-5 text-purple-600 mr-3 ml-1" /> Select students
                  </div>
                </div>
              </div>
            </div> */}

            {/* <div>
              <p className="text-sm text-black-500 mb-2">Points</p>
              <div className="relative">
                <select 
                  className="w-full p-2 text-sm border rounded-md appearance-none bg-white text-gray-600"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                >
                  <option value={100}>100</option>
                  <option value={50}>50</option>
                  <option value={25}>25</option>
                  <option value={10}>10</option>
                  <option value={0}>Ungraded</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div> */}

            <div>
              <p className="text-sm text-black-500 mb-2">Due</p>
              <div className="relative">
                {/* MUI DateTimePicker integration */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={["DateTimePicker"]}>
                  <DateTimePicker
                    value={dueDate}
                    onChange={(newValue) => setDueDate(newValue)}
                  />
                </DemoContainer>
              </LocalizationProvider>
              </div>
            </div>
            {/* <div>
              <p className="text-sm text-black-500 mb-2">Topic</p>
              <div className="relative mb-10">
                <select className="w-full p-2 text-sm border rounded-md appearance-none bg-white text-gray-600">
                  <option>No topic</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div> */}
          </div>
        </div>

      </div>
    </div>
  );
}