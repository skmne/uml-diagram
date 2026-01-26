// Data Structures for UML Diagrams
// This file contains different project structures that can be used

// Java Spring Boot Project Structure
export const javaSpringBootStructure = {
	name: "Java Spring Boot - Task Management System",
	description: "Typical Spring Boot application with layered architecture",
	
	nodes: [
		// Entity Layer
		{
			id: "Task",
			name: "Task",
			namespace: "com.example.taskmanagement.entity",
			width: 220,
			height: 80,
			layer: "entity",
		},
		{
			id: "User",
			name: "User",
			namespace: "com.example.taskmanagement.entity",
			width: 220,
			height: 80,
			layer: "entity",
		},
		{
			id: "Project",
			name: "Project",
			namespace: "com.example.taskmanagement.entity",
			width: 220,
			height: 80,
			layer: "entity",
		},
		{
			id: "BaseEntity",
			name: "BaseEntity",
			namespace: "com.example.taskmanagement.entity",
			width: 220,
			height: 80,
			layer: "entity",
		},

		// Service Layer
		{
			id: "TaskService",
			name: "TaskService",
			namespace: "com.example.taskmanagement.service",
			width: 220,
			height: 80,
			layer: "service",
		},
		{
			id: "UserService",
			name: "UserService",
			namespace: "com.example.taskmanagement.service",
			width: 220,
			height: 80,
			layer: "service",
		},
		{
			id: "ProjectService",
			name: "ProjectService",
			namespace: "com.example.taskmanagement.service",
			width: 220,
			height: 80,
			layer: "service",
		},

		// Repository Layer
		{
			id: "TaskRepository",
			name: "TaskRepository",
			namespace: "com.example.taskmanagement.repository",
			width: 220,
			height: 80,
			layer: "repository",
		},
		{
			id: "UserRepository",
			name: "UserRepository",
			namespace: "com.example.taskmanagement.repository",
			width: 220,
			height: 80,
			layer: "repository",
		},
		{
			id: "JpaRepository",
			name: "JpaRepository<T, ID>",
			namespace: "org.springframework.data.jpa.repository",
			width: 280,
			height: 80,
			layer: "repository",
		},

		// Controller Layer
		{
			id: "TaskController",
			name: "TaskController",
			namespace: "com.example.taskmanagement.controller",
			width: 220,
			height: 80,
			layer: "controller",
		},
		{
			id: "UserController",
			name: "UserController",
			namespace: "com.example.taskmanagement.controller",
			width: 220,
			height: 80,
			layer: "controller",
		},

		// DTO Layer
		{
			id: "TaskDTO",
			name: "TaskDTO",
			namespace: "com.example.taskmanagement.dto",
			width: 220,
			height: 80,
			layer: "dto",
		},
		{
			id: "UserDTO",
			name: "UserDTO",
			namespace: "com.example.taskmanagement.dto",
			width: 220,
			height: 80,
			layer: "dto",
		},

		// Exception Layer
		{
			id: "TaskNotFoundException",
			name: "TaskNotFoundException",
			namespace: "com.example.taskmanagement.exception",
			width: 260,
			height: 80,
			layer: "exception",
		},
		{
			id: "RuntimeException",
			name: "RuntimeException",
			namespace: "java.lang",
			width: 220,
			height: 80,
			layer: "exception",
		},

		// Utility Layer
		{
			id: "TaskMapper",
			name: "TaskMapper",
			namespace: "com.example.taskmanagement.mapper",
			width: 220,
			height: 80,
			layer: "utility",
		},
		{
			id: "ValidationUtils",
			name: "ValidationUtils",
			namespace: "com.example.taskmanagement.util",
			width: 240,
			height: 80,
			layer: "utility",
		},
	],

	links: [
		// Entity Inheritance
		{
			source: "Task",
			target: "BaseEntity",
			type: "Inheritance",
		},
		{
			source: "User",
			target: "BaseEntity",
			type: "Inheritance",
		},
		{
			source: "Project",
			target: "BaseEntity",
			type: "Inheritance",
		},

		// Repository Realization
		{
			source: "TaskRepository",
			target: "JpaRepository",
			type: "Realization",
		},
		{
			source: "UserRepository",
			target: "JpaRepository",
			type: "Realization",
		},

		// Service uses Repository
		{
			source: "TaskService",
			target: "TaskRepository",
			type: "Directed Association",
		},
		{
			source: "UserService",
			target: "UserRepository",
			type: "Directed Association",
		},
		{
			source: "ProjectService",
			target: "TaskRepository",
			type: "Directed Association",
		},

		// Service uses Entity
		{
			source: "TaskService",
			target: "Task",
			type: "Directed Association",
		},
		{
			source: "UserService",
			target: "User",
			type: "Directed Association",
		},
		{
			source: "ProjectService",
			target: "Project",
			type: "Directed Association",
		},

		// Controller uses Service
		{
			source: "TaskController",
			target: "TaskService",
			type: "Directed Association",
		},
		{
			source: "UserController",
			target: "UserService",
			type: "Directed Association",
		},

		// Controller uses DTO
		{
			source: "TaskController",
			target: "TaskDTO",
			type: "Directed Association",
		},
		{
			source: "UserController",
			target: "UserDTO",
			type: "Directed Association",
		},

		// Mapper converts Entity to DTO
		{
			source: "TaskMapper",
			target: "Task",
			type: "Directed Association",
		},
		{
			source: "TaskMapper",
			target: "TaskDTO",
			type: "Directed Association",
		},
		{
			source: "TaskService",
			target: "TaskMapper",
			type: "Directed Association",
		},

		// Exception Inheritance
		{
			source: "TaskNotFoundException",
			target: "RuntimeException",
			type: "Inheritance",
		},
		{
			source: "TaskService",
			target: "TaskNotFoundException",
			type: "Directed Association",
		},

		// Entity Relationships
		{
			source: "Task",
			target: "User",
			type: "Directed Association",
		},
		{
			source: "Task",
			target: "Project",
			type: "Directed Association",
		},

		// Utility usage
		{
			source: "TaskService",
			target: "ValidationUtils",
			type: "Directed Association",
		},
		{
			source: "UserService",
			target: "ValidationUtils",
			type: "Directed Association",
		},
	],
};

// Export default structure (for backward compatibility)
export const javaProjectData = javaSpringBootStructure;

// You can add more structures here:
// export const microservicesStructure = { ... };
// export const frontendStructure = { ... };
// etc.
