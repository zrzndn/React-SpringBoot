# React + Spring Boot Employee Management System

A full-stack web application built with **React** and **Java Spring Boot**, demonstrating frontend development, backend API integration, and full-stack application architecture.

The project separates the frontend and backend into independent applications, making development, testing, and future deployment easier to manage.

## Project Structure

```text
React-SpringBoot/
├── frontend/   # React frontend application
├── backend/    # Spring Boot backend and REST API
└── README.md
```

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Java | Backend programming language |
| Spring Boot | Backend application and REST API |
| HTTP / REST | Communication between frontend and backend |
| Node.js & npm | Frontend development and package management |
| Maven | Backend dependency management and build |
| Git & GitHub | Version control and source code hosting |

## Getting Started

### Prerequisites

Install the following tools:

- [Git](https://git-scm.com/)
- [Node.js and npm](https://nodejs.org/)
- [Java JDK](https://adoptium.net/)
- [Apache Maven](https://maven.apache.org/) (if the project does not include a Maven Wrapper)

### 1. Clone the Repository

```bash
git clone https://github.com/zrzndn/React-SpringBoot.git
cd React-SpringBoot
```

### 2. Start the Backend

Open a terminal in the project root.

**Windows:**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

If the Maven Wrapper is not included, use:

```bash
mvn spring-boot:run
```

The backend commonly runs on `http://localhost:8080`, unless configured otherwise.

Check the backend configuration in `backend/src/main/resources/application.properties` or `application.yml` for the actual port and any database requirements.

### 3. Start the Frontend

Open a second terminal in the project root.

```bash
cd frontend
npm install
```

To see the available scripts:

```bash
npm run
```

Start the frontend using the script defined in `frontend/package.json`. For example, a Vite-based project typically uses:

```bash
npm run dev
```

A Create React App project may instead use:

```bash
npm start
```

Open the local URL displayed in the terminal.

### 4. Connect Frontend and Backend

Ensure the frontend's API base URL points to the running Spring Boot backend.

For local development, the URL may look like:

```text
http://localhost:8080
```

The actual API endpoints depend on the backend implementation. Configure CORS on the backend if requests from the frontend's development origin are blocked.

## Development Workflow

1. Develop UI components and pages in `frontend/`.
2. Implement backend logic and API endpoints in `backend/`.
3. Connect the frontend to the backend through HTTP requests.
4. Test application behaviour and error handling.
5. Commit changes to Git and push them to GitHub.

## Testing and Build

### Backend

Run backend tests:

```bash
mvn test
```

Package the backend:

```bash
mvn package
```

If the project includes a Maven Wrapper, use `.\mvnw.cmd test` and `.\mvnw.cmd package` on Windows.

### Frontend

Check the available scripts:

```bash
npm run
```

Run the configured production build script, commonly:

```bash
npm run build
```

The actual test and build commands depend on the project's configuration.
