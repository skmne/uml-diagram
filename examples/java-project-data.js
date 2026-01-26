// Java Project Structure - Task Management System
// Realistic Java classes with relationships

export const javaProjectData = {
	nodes: [
		// Entity Classes
		{
			id: "Task",
			name: "Task",
			namespace: "com.example.taskmanagement.entity",
			width: 220,
			height: 80,
		},
		{
			id: "User",
			name: "User",
			namespace: "com.example.taskmanagement.entity",
			width: 220,
			height: 80,
		},
		{
			id: "Project",
			name: "Project",
			namespace: "com.example.taskmanagement.entity",
			width: 220,
			height: 80,
		},
		{
			id: "BaseEntity",
			name: "BaseEntity",
			namespace: "com.example.taskmanagement.entity",
			width: 220,
			height: 80,
		},

		// Service Layer
		{
			id: "TaskService",
			name: "TaskService",
			namespace: "com.example.taskmanagement.service",
			width: 220,
			height: 80,
		},
		{
			id: "UserService",
			name: "UserService",
			namespace: "com.example.taskmanagement.service",
			width: 220,
			height: 80,
		},
		{
			id: "ProjectService",
			name: "ProjectService",
			namespace: "com.example.taskmanagement.service",
			width: 220,
			height: 80,
		},

		// Repository Layer
		{
			id: "TaskRepository",
			name: "TaskRepository",
			namespace: "com.example.taskmanagement.repository",
			width: 220,
			height: 80,
		},
		{
			id: "UserRepository",
			name: "UserRepository",
			namespace: "com.example.taskmanagement.repository",
			width: 220,
			height: 80,
		},
		{
			id: "JpaRepository",
			name: "JpaRepository<T, ID>",
			namespace: "org.springframework.data.jpa.repository",
			width: 280,
			height: 80,
		},

		// Controller Layer
		{
			id: "TaskController",
			name: "TaskController",
			namespace: "com.example.taskmanagement.controller",
			width: 220,
			height: 80,
		},
		{
			id: "UserController",
			name: "UserController",
			namespace: "com.example.taskmanagement.controller",
			width: 220,
			height: 80,
		},

		// DTO Classes
		{
			id: "TaskDTO",
			name: "TaskDTO",
			namespace: "com.example.taskmanagement.dto",
			width: 220,
			height: 80,
		},
		{
			id: "UserDTO",
			name: "UserDTO",
			namespace: "com.example.taskmanagement.dto",
			width: 220,
			height: 80,
		},

		// Exception Classes
		{
			id: "TaskNotFoundException",
			name: "TaskNotFoundException",
			namespace: "com.example.taskmanagement.exception",
			width: 260,
			height: 80,
		},
		{
			id: "RuntimeException",
			name: "RuntimeException",
			namespace: "java.lang",
			width: 220,
			height: 80,
		},

		// Utility Classes
		{
			id: "TaskMapper",
			name: "TaskMapper",
			namespace: "com.example.taskmanagement.mapper",
			width: 220,
			height: 80,
		},
		{
			id: "ValidationUtils",
			name: "ValidationUtils",
			namespace: "com.example.taskmanagement.util",
			width: 240,
			height: 80,
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

		// Repository Inheritance
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
