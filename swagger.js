const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "QuanLyTask API",
      version: "1.0.0",
      description: "API documentation for Task Management System",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60d21b4667d0d8992e610c85" },
            username: { type: "string", example: "john_doe" },
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "hashed_password" },
            googleId: { type: "string", example: "123456789" },
            avatar: { type: "string", example: "https://example.com/avatar.jpg" },
            role: { type: "string", enum: ["admin", "user"], example: "user" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Task: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60d21b4667d0d8992e610c86" },
            title: { type: "string", example: "Complete project documentation" },
            description: { type: "string", example: "Write API docs for the project" },
            priority: { type: "string", enum: ["low", "medium", "high"], example: "high" },
            status: { type: "string", enum: ["pending", "progress", "reviewing", "completed"], example: "progress" },
            deadline: { type: "string", format: "date-time", example: "2025-04-15T00:00:00Z" },
            isDeleted: { type: "boolean", example: false },
            teamId: { type: "string", example: "60d21b4667d0d8992e610c87" },
            projectId: { type: "string", example: "60d21b4667d0d8992e610c88" },
            assigneeId: { type: "string", example: "60d21b4667d0d8992e610c85" },
            subTasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string", example: "Create outline" },
                  completed: { type: "boolean", example: true },
                },
              },
            },
            attachments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", example: "document.pdf" },
                  path: { type: "string", example: "uploads/1234567890-file.pdf" },
                  size: { type: "number", example: 1024000 },
                  mimetype: { type: "string", example: "application/pdf" },
                  uploadedAt: { type: "string", format: "date-time" },
                },
              },
            },
            deadlineEmailSent: { type: "boolean", example: false },
            userId: { type: "string", example: "60d21b4667d0d8992e610c85" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Project: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Website Redesign" },
            description: { type: "string", example: "Redesign company website" },
            ownerId: { type: "string" },
            teamId: { type: "string" },
            status: { type: "string", enum: ["active", "archived", "completed"], example: "active" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Team: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Development Team" },
            ownerId: { type: "string" },
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  role: { type: "string", enum: ["admin", "member"], example: "member" },
                  joinedAt: { type: "string", format: "date-time" },
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            text: { type: "string", example: "Great work on this task!" },
            taskId: { type: "string" },
            userId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Attachment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "report.pdf" },
            path: { type: "string", example: "uploads/1234567890-report.pdf" },
            size: { type: "number", example: 2048000 },
            mimetype: { type: "string", example: "application/pdf" },
            userId: { type: "string" },
            taskId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Log: {
          type: "object",
          properties: {
            _id: { type: "string" },
            action: { type: "string", example: "Task created" },
            userId: { type: "string" },
            taskId: { type: "string" },
            details: { type: "string", example: "User created a new task" },
            changes: { type: "array", items: { type: "object" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        TimeLog: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            taskId: { type: "string" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            duration: { type: "number", description: "Duration in minutes", example: 120 },
            note: { type: "string", example: "Working on frontend" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Label: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Bug" },
            color: { type: "string", example: "#e74c3c" },
            userId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            title: { type: "string", example: "Task Assigned" },
            message: { type: "string", example: "You have been assigned to a new task" },
            isRead: { type: "boolean", example: false },
            type: { type: "string", enum: ["task", "team", "system"], example: "task" },
            link: { type: "string", example: "/tasks/123" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Invitation: {
          type: "object",
          properties: {
            _id: { type: "string" },
            teamId: { type: "string" },
            senderId: { type: "string" },
            receiverEmail: { type: "string", example: "newmember@example.com" },
            status: { type: "string", enum: ["pending", "accepted", "rejected"], example: "pending" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "Error message" },
          },
        },
      },
    },
    paths: {
      // Auth Routes
      "/auth/register": {
        post: {
          summary: "Register a new user",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    username: { type: "string", example: "john_doe" },
                    email: { type: "string", example: "john@example.com" },
                    password: { type: "string", example: "password123" },
                  },
                  required: ["username", "email", "password"],
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Validation error" },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "Login user",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", example: "john@example.com" },
                    password: { type: "string", example: "password123" },
                  },
                  required: ["email", "password"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/auth/google": {
        post: {
          summary: "Login with Google",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", example: "google_oauth_token" },
                  },
                  required: ["token"],
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful" },
            401: { description: "Invalid token" },
          },
        },
      },

      // Task Routes
      "/tasks": {
        get: {
          summary: "Get all tasks",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
            { name: "priority", in: "query", schema: { type: "string", enum: ["low", "medium", "high"] } },
            { name: "status", in: "query", schema: { type: "string", enum: ["pending", "progress", "reviewing", "completed"] } },
          ],
          responses: {
            200: {
              description: "List of tasks",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Task" },
                  },
                },
              },
            },
            401: { description: "Unauthorized" },
          },
        },
        post: {
          summary: "Create a new task",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string", example: "New Task" },
                    description: { type: "string", example: "Task description" },
                    priority: { type: "string", enum: ["low", "medium", "high"], example: "medium" },
                    deadline: { type: "string", format: "date-time" },
                    assigneeId: { type: "string" },
                    teamId: { type: "string" },
                  },
                  required: ["title"],
                },
              },
            },
          },
          responses: {
            201: { description: "Task created successfully" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/tasks/stats": {
        get: {
          summary: "Get task statistics",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Task statistics" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/tasks/deadline-alerts": {
        get: {
          summary: "Get deadline alerts",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "List of tasks with approaching deadlines" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/tasks/{id}": {
        get: {
          summary: "Get task by ID",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Task details" },
            404: { description: "Task not found" },
            401: { description: "Unauthorized" },
          },
        },
        put: {
          summary: "Update task",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["low", "medium", "high"] },
                    status: { type: "string", enum: ["pending", "progress", "reviewing", "completed"] },
                    deadline: { type: "string", format: "date-time" },
                    assigneeId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Task updated" },
            404: { description: "Task not found" },
            401: { description: "Unauthorized" },
          },
        },
        delete: {
          summary: "Delete task",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Task deleted" },
            404: { description: "Task not found" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/tasks/bulk": {
        post: {
          summary: "Create multiple tasks",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string" },
                      deadline: { type: "string", format: "date-time" },
                    },
                    required: ["title"],
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Tasks created" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/tasks/analytics": {
        get: {
          summary: "Get system-wide task analytics (Admin only)",
          description: "Returns analytics data for all tasks in the system. **Requires admin role.**",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { 
              description: "Analytics data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "array" },
                      priority: { type: "array" },
                      summary: {
                        type: "object",
                        properties: {
                          totalTasks: { type: "number" },
                          totalUsers: { type: "number" },
                          totalTeams: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
            403: { description: "Forbidden - Admin access required" },
            401: { description: "Unauthorized" },
          },
        },
      },

      // Sub-Tasks
      "/tasks/{taskId}/subtasks": {
        post: {
          summary: "Add sub-task",
          tags: ["Sub-Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "taskId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    text: { type: "string", example: "Sub-task description" },
                  },
                  required: ["text"],
                },
              },
            },
          },
          responses: {
            201: { description: "Sub-task added" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/tasks/{taskId}/subtasks/{subTaskId}": {
        patch: {
          summary: "Toggle sub-task completion",
          tags: ["Sub-Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "taskId", in: "path", required: true, schema: { type: "string" } },
            { name: "subTaskId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Sub-task toggled" },
            404: { description: "Not found" },
            401: { description: "Unauthorized" },
          },
        },
        delete: {
          summary: "Delete sub-task",
          tags: ["Sub-Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "taskId", in: "path", required: true, schema: { type: "string" } },
            { name: "subTaskId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Sub-task deleted" },
            404: { description: "Not found" },
            401: { description: "Unauthorized" },
          },
        },
      },

      // Attachments
      "/tasks/{taskId}/attachments": {
        post: {
          summary: "Add attachment to task",
          tags: ["Attachments"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "taskId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                  },
                  required: ["file"],
                },
              },
            },
          },
          responses: {
            201: { description: "Attachment added" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/tasks/{taskId}/attachments/{attachmentId}": {
        delete: {
          summary: "Delete attachment",
          tags: ["Attachments"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "taskId", in: "path", required: true, schema: { type: "string" } },
            { name: "attachmentId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Attachment deleted" },
            404: { description: "Not found" },
            401: { description: "Unauthorized" },
          },
        },
      },

      // Time Logs
      "/timelogs/me": {
        get: {
          summary: "Get my time logs",
          tags: ["Time Logs"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of time logs",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TimeLog" },
                  },
                },
              },
            },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/tasks/{taskId}/timelogs": {
        get: {
          summary: "Get task time logs",
          tags: ["Time Logs"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "taskId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "List of time logs for task" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/tasks/{taskId}/timelogs/start": {
        post: {
          summary: "Start time tracking",
          tags: ["Time Logs"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "taskId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            201: { description: "Time log started" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/timelogs/{logId}/stop": {
        patch: {
          summary: "Stop time tracking",
          tags: ["Time Logs"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "logId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Time log stopped" },
            404: { description: "Time log not found" },
            401: { description: "Unauthorized" },
          },
        },
      },

      // Comments
      "/comments/{taskId}": {
        get: {
          summary: "Get comments by task ID",
          tags: ["Comments"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "taskId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "List of comments",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Comment" },
                  },
                },
              },
            },
            401: { description: "Unauthorized" },
          },
        },
        post: {
          summary: "Add comment",
          tags: ["Comments"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "taskId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    text: { type: "string", example: "Great progress!" },
                  },
                  required: ["text"],
                },
              },
            },
          },
          responses: {
            201: { description: "Comment added" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/comments/{commentId}": {
        delete: {
          summary: "Delete comment",
          tags: ["Comments"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "commentId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Comment deleted" },
            404: { description: "Comment not found" },
            401: { description: "Unauthorized" },
          },
        },
      },

      // Activity Logs
      "/logs": {
        get: {
          summary: "Get all system logs (Admin only)",
          description: "Returns all activity logs across the system with pagination. **Requires admin role.**",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          ],
          responses: {
            200: {
              description: "List of all logs with pagination",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      logs: { type: "array", items: { $ref: "#/components/schemas/Log" } },
                      pagination: {
                        type: "object",
                        properties: {
                          current: { type: "number" },
                          total: { type: "number" },
                          count: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
            403: { description: "Forbidden - Admin access required" },
            401: { description: "Unauthorized" },
          },
        },
      },

      "/logs/{taskId}": {
        get: {
          summary: "Get logs by task ID",
          description: "Returns logs for a specific task. Admin can view any task logs, regular users can only view logs for tasks they have access to.",
          tags: ["Activity Logs"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "taskId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "List of activity logs",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Log" },
                  },
                },
              },
            },
            404: { description: "Task not found or access denied" },
            401: { description: "Unauthorized" },
          },
        },
      },

      // Teams
      "/teams": {
        get: {
          summary: "Get my teams",
          tags: ["Teams"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of teams",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Team" },
                  },
                },
              },
            },
            401: { description: "Unauthorized" },
          },
        },
        post: {
          summary: "Create team",
          tags: ["Teams"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "Development Team" },
                  },
                  required: ["name"],
                },
              },
            },
          },
          responses: {
            201: { description: "Team created" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/teams/{teamId}": {
        delete: {
          summary: "Delete team (Admin or Owner only)",
          description: "Deletes a team and removes team association from related tasks. **Requires admin role or team ownership.**",
          tags: ["Teams"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "teamId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Team deleted successfully" },
            403: { description: "Forbidden - Only admin or owner can delete" },
            404: { description: "Team not found" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/teams/{teamId}/members": {
        post: {
          summary: "Add member to team",
          description: "Add a member to team. Admin or team admin/owner can add members and assign admin role.",
          tags: ["Teams"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "teamId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", example: "member@example.com" },
                    role: { type: "string", enum: ["admin", "member"], example: "member" },
                  },
                  required: ["email"],
                },
              },
            },
          },
          responses: {
            201: { description: "Member added" },
            403: { description: "Forbidden - Only admin or owner can add members" },
            404: { description: "Team or user not found" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/teams/{teamId}/members/{memberId}": {
        delete: {
          summary: "Remove member from team",
          description: "Remove a member from team. Only admin or team owner can remove members.",
          tags: ["Teams"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "teamId", in: "path", required: true, schema: { type: "string" } },
            { name: "memberId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Member removed" },
            403: { description: "Forbidden - Only admin or owner can remove members" },
            400: { description: "Cannot remove team owner or yourself" },
            404: { description: "Not found" },
            401: { description: "Unauthorized" },
          },
        },
      },

      // Projects
      "/projects": {
        get: {
          summary: "Get projects",
          description: "Returns all projects for admin, or projects owned by/assigned to the user",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of projects",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Project" },
                  },
                },
              },
            },
            401: { description: "Unauthorized" },
          },
        },
        post: {
          summary: "Create project",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "Website Redesign" },
                    description: { type: "string", example: "Redesign company website" },
                    teamId: { type: "string" },
                  },
                  required: ["name"],
                },
              },
            },
          },
          responses: {
            201: { description: "Project created" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/projects/{projectId}": {
        delete: {
          summary: "Delete project (Admin or Owner only)",
          description: "Deletes a project and all related tasks. **Requires admin role or project ownership.**",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Project and related tasks deleted" },
            403: { description: "Forbidden - Only admin or owner can delete" },
            404: { description: "Project not found" },
            401: { description: "Unauthorized" },
          },
        },
      },

      "/admin/users": {
        get: {
          summary: "Get all users (Admin only)",
          description: "Returns a list of all users in the system. **Requires admin role.**",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of users",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
            403: { description: "Forbidden - Admin access required" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/admin/users/{userId}/role": {
        patch: {
          summary: "Update user role (Admin only)",
          description: "Updates the role of a user (user or admin). **Requires admin role.**",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "userId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    role: { type: "string", enum: ["admin", "user"], example: "admin" },
                  },
                  required: ["role"],
                },
              },
            },
          },
          responses: {
            200: { description: "User role updated" },
            400: { description: "Invalid role" },
            403: { description: "Forbidden - Admin access required" },
            404: { description: "User not found" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/admin/users/{userId}": {
        delete: {
          summary: "Delete user (Admin only)",
          description: "Deletes a user and all their tasks. Cannot delete yourself. **Requires admin role.**",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "userId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "User deleted successfully" },
            400: { description: "Cannot delete yourself" },
            403: { description: "Forbidden - Admin access required" },
            404: { description: "User not found" },
            401: { description: "Unauthorized" },
          },
        },
      },

      // AI
      "/ai/roadmap-suggest": {
        post: {
          summary: "Generate AI roadmap suggestion",
          tags: ["AI"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    goal: { type: "string", example: "Build a mobile app in 3 months" },
                    deadline: { type: "string", format: "date-time" },
                  },
                  required: ["goal"],
                },
              },
            },
          },
          responses: {
            200: { description: "Roadmap suggestions" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/ai/roadmap-apply": {
        post: {
          summary: "Apply AI roadmap and create tasks (Admin only)",
          description: "Creates multiple tasks from AI-generated roadmap. **Requires admin role.**",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tasks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          priority: { type: "string" },
                          subTasks: { type: "array", items: { type: "string" } },
                          deadlineDays: { type: "number" },
                        },
                      },
                    },
                    teamId: { type: "string" },
                  },
                  required: ["tasks"],
                },
              },
            },
          },
          responses: {
            201: { description: "Tasks created from roadmap" },
            403: { description: "Forbidden - Admin access required" },
            401: { description: "Unauthorized" },
          },
        },
      },
    },
  },
  apis: [], // We'll define everything in options.definition
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
