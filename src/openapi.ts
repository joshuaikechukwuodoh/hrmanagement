/**
 * OpenAPI 3.1 description of the HR Management API.
 * Served at GET /openapi.json and rendered by Swagger UI at /ui.
 */
export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "HR Management API",
    version: "1.0.0",
    description: [
      "Bun + Hono HR API with Better Auth and UploadThing.",
      "",
      "## Auth",
      "1. Call **POST /api/auth/sign-in/email** with email + password.",
      "2. The session cookie is stored by the browser (Swagger: enable **Authorize** → cookie auth, or just use *Try it out* after sign-in from the same origin).",
      "3. Protected routes return **401** without a valid session.",
      "",
      "Test user: `hr.admin@example.com` / `Password123!`",
    ].join("\n"),
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
  ],
  tags: [
    { name: "Health", description: "Health checks" },
    { name: "Auth", description: "Better Auth (sign-up, sign-in, session)" },
    { name: "Departments", description: "Department CRUD (auth required)" },
    { name: "Employees", description: "Employee profiles (auth required)" },
    { name: "Leaves", description: "Leave requests (auth required)" },
    { name: "Attendances", description: "Attendance check-in/out (auth required)" },
    { name: "Documents", description: "Document records (auth required)" },
    { name: "UploadThing", description: "File upload router" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description: "Session cookie set after sign-in",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      Department: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      EmployeeProfile: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          phone: { type: "string", nullable: true },
          role: {
            type: "string",
            enum: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
          },
          departmentId: { type: "string", nullable: true },
          hireDate: { type: "string", format: "date", nullable: true },
          status: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Leave: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          type: {
            type: "string",
            enum: ["ANNUAL", "SICK", "UNPAID", "MATERNITY", "PATERNITY", "OTHER"],
          },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          reason: { type: "string", nullable: true },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
          },
          approvedBy: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Attendance: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          date: { type: "string", format: "date" },
          checkIn: { type: "string", format: "date-time", nullable: true },
          checkOut: { type: "string", format: "date-time", nullable: true },
          status: {
            type: "string",
            enum: ["PRESENT", "ABSENT", "LATE", "HALF_DAY"],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Document: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          title: { type: "string" },
          fileUrl: { type: "string" },
          type: { type: "string" },
          uploadedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        security: [],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } },
                },
              },
            },
          },
        },
      },
    },
    "/session": {
      get: {
        tags: ["Auth"],
        summary: "Current app session",
        description: "Returns the logged-in user + session, or 401.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Authenticated session" },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/sign-up/email": {
      post: {
        tags: ["Auth"],
        summary: "Sign up with email",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  email: { type: "string", format: "email", example: "jane@example.com" },
                  password: { type: "string", format: "password", example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "User created + session" },
          "400": { description: "Validation / user already exists" },
        },
      },
    },
    "/api/auth/sign-in/email": {
      post: {
        tags: ["Auth"],
        summary: "Sign in with email",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "hr.admin@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "Password123!",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Signed in (sets session cookie)" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/sign-out": {
      post: {
        tags: ["Auth"],
        summary: "Sign out",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": { description: "Signed out" },
        },
      },
    },
    "/api/auth/get-session": {
      get: {
        tags: ["Auth"],
        summary: "Better Auth get-session",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Session object or null" },
        },
      },
    },

    // Departments
    "/api/departments": {
      get: {
        tags: ["Departments"],
        summary: "List departments",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Department" },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Departments"],
        summary: "Create department",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Engineering" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "409": { description: "Name already exists" },
        },
      },
    },
    "/api/departments/{id}": {
      patch: {
        tags: ["Departments"],
        summary: "Update department",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Departments"],
        summary: "Delete department",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Deleted" },
          "404": { description: "Not found" },
        },
      },
    },

    // Employees
    "/api/employees": {
      get: {
        tags: ["Employees"],
        summary: "List employee profiles",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/EmployeeProfile" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Employees"],
        summary: "Create employee profile",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: {
                    type: "string",
                    description: "Defaults to current user",
                  },
                  phone: { type: "string", example: "+1234567890" },
                  role: {
                    type: "string",
                    enum: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
                  },
                  departmentId: { type: "string" },
                  hireDate: {
                    type: "string",
                    format: "date",
                    example: "2025-01-15",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "409": { description: "Profile already exists" },
        },
      },
    },
    "/api/employees/me": {
      get: {
        tags: ["Employees"],
        summary: "My employee profile",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Profile" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/employees/{userId}": {
      get: {
        tags: ["Employees"],
        summary: "Get profile by user id",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Profile" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Employees"],
        summary: "Update employee profile",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  phone: { type: "string" },
                  role: {
                    type: "string",
                    enum: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
                  },
                  departmentId: { type: "string", nullable: true },
                  status: {
                    type: "string",
                    enum: ["ACTIVE", "INACTIVE", "TERMINATED"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "404": { description: "Not found" },
        },
      },
    },

    // Leaves
    "/api/leaves": {
      get: {
        tags: ["Leaves"],
        summary: "List leaves",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "List",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Leave" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Leaves"],
        summary: "Create leave request",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "startDate", "endDate"],
                properties: {
                  userId: { type: "string" },
                  type: {
                    type: "string",
                    enum: [
                      "ANNUAL",
                      "SICK",
                      "UNPAID",
                      "MATERNITY",
                      "PATERNITY",
                      "OTHER",
                    ],
                    example: "ANNUAL",
                  },
                  startDate: {
                    type: "string",
                    format: "date",
                    example: "2026-09-01",
                  },
                  endDate: {
                    type: "string",
                    format: "date",
                    example: "2026-09-05",
                  },
                  reason: { type: "string", example: "Vacation" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/leaves/me": {
      get: {
        tags: ["Leaves"],
        summary: "My leaves",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "List" },
        },
      },
    },
    "/api/leaves/{id}/status": {
      patch: {
        tags: ["Leaves"],
        summary: "Update leave status",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["APPROVED", "REJECTED", "CANCELLED"],
                    example: "APPROVED",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "404": { description: "Not found" },
        },
      },
    },

    // Attendances
    "/api/attendances": {
      get: {
        tags: ["Attendances"],
        summary: "List attendances",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "List",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Attendance" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Attendances"],
        summary: "Check-in / create attendance",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["date"],
                properties: {
                  userId: { type: "string" },
                  date: {
                    type: "string",
                    format: "date",
                    example: "2026-08-01",
                  },
                  checkIn: {
                    type: "string",
                    format: "date-time",
                  },
                  status: {
                    type: "string",
                    enum: ["PRESENT", "ABSENT", "LATE", "HALF_DAY"],
                    example: "PRESENT",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
        },
      },
    },
    "/api/attendances/me": {
      get: {
        tags: ["Attendances"],
        summary: "My attendance",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "List" },
        },
      },
    },
    "/api/attendances/{id}": {
      patch: {
        tags: ["Attendances"],
        summary: "Check-out / update attendance",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  checkOut: { type: "string", format: "date-time" },
                  status: {
                    type: "string",
                    enum: ["PRESENT", "ABSENT", "LATE", "HALF_DAY"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "404": { description: "Not found" },
        },
      },
    },

    // Documents
    "/api/documents": {
      get: {
        tags: ["Documents"],
        summary: "List documents",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "List",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Document" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Documents"],
        summary: "Create document record (manual URL)",
        description:
          "Usually created automatically by UploadThing. You can also POST a URL here.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "fileUrl", "type"],
                properties: {
                  userId: { type: "string" },
                  title: { type: "string", example: "Contract" },
                  fileUrl: {
                    type: "string",
                    example: "https://example.com/file.pdf",
                  },
                  type: { type: "string", example: "CONTRACT" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
        },
      },
    },
    "/api/documents/me": {
      get: {
        tags: ["Documents"],
        summary: "My documents",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "List" },
        },
      },
    },
    "/api/documents/{id}": {
      delete: {
        tags: ["Documents"],
        summary: "Delete document record",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Deleted" },
        },
      },
    },

    // UploadThing
    "/api/uploadthing": {
      get: {
        tags: ["UploadThing"],
        summary: "Upload router config",
        description: "Returns available upload slugs and file limits.",
        security: [],
        responses: {
          "200": { description: "Router config (documentUploader)" },
        },
      },
    },
  },
} as const;
