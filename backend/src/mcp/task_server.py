"""
MCP Server with Task Management Tools.
"""

import json
from typing import Any, Dict, List, Optional
from uuid import UUID

from mcp.server import Server
from mcp.types import Tool, TextContent
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import Task


class TaskMCPServer:
    """MCP Server for task management tools."""
    
    def __init__(self):
        self.server = Server("task-manager")
        self._register_tools()
    
    def _register_tools(self):
        """Register all MCP tools."""
        
        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            return [
                Tool(
                    name="add_task",
                    description="Create a new task",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User ID"},
                            "title": {"type": "string", "description": "Task title"},
                            "description": {"type": "string", "description": "Task description (optional)"}
                        },
                        "required": ["user_id", "title"]
                    }
                ),
                Tool(
                    name="list_tasks",
                    description="Retrieve tasks from the list",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User ID"},
                            "status": {"type": "string", "enum": ["all", "pending", "completed"], "description": "Filter by status"}
                        },
                        "required": ["user_id"]
                    }
                ),
                Tool(
                    name="complete_task",
                    description="Mark a task as complete by ID or title",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User ID"},
                            "task_id": {"type": "string", "description": "Task ID (optional)"},
                            "title": {"type": "string", "description": "Task title to search (optional)"}
                        },
                        "required": ["user_id"]
                    }
                ),
                Tool(
                    name="delete_task",
                    description="Remove a task from the list by ID or title",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User ID"},
                            "task_id": {"type": "string", "description": "Task ID (optional)"},
                            "title": {"type": "string", "description": "Task title to search (optional)"}
                        },
                        "required": ["user_id"]
                    }
                ),
                Tool(
                    name="update_task",
                    description="Modify task title or description by ID or current title",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User ID"},
                            "task_id": {"type": "string", "description": "Task ID (optional)"},
                            "current_title": {"type": "string", "description": "Current task title to search (optional)"},
                            "title": {"type": "string", "description": "New title (optional)"},
                            "description": {"type": "string", "description": "New description (optional)"}
                        },
                        "required": ["user_id"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
            """Handle tool calls."""
            
            if name == "add_task":
                return await self._add_task(arguments)
            elif name == "list_tasks":
                return await self._list_tasks(arguments)
            elif name == "complete_task":
                return await self._complete_task(arguments)
            elif name == "delete_task":
                return await self._delete_task(arguments)
            elif name == "update_task":
                return await self._update_task(arguments)
            else:
                return [TextContent(type="text", text=f"Unknown tool: {name}")]
    
    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> List[TextContent]:
        """Wrapper to call MCP tools directly."""
        if name == "add_task":
            return await self._add_task(arguments)
        elif name == "list_tasks":
            return await self._list_tasks(arguments)
        elif name == "complete_task":
            return await self._complete_task(arguments)
        elif name == "delete_task":
            return await self._delete_task(arguments)
        elif name == "update_task":
            return await self._update_task(arguments)
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    
    async def _add_task(self, args: Dict[str, Any]) -> List[TextContent]:
        """Add a new task."""
        try:
            async for db in get_db():
                # Only add description if explicitly provided and not empty
                description = args.get("description", "")
                if description and description.strip():
                    description = description.strip()
                else:
                    description = ""
                
                task = Task(
                    user_id=UUID(args["user_id"]),
                    title=args["title"],
                    description=description,
                    completed=False
                )
                db.add(task)
                await db.commit()
                await db.refresh(task)
                
                result = {
                    "task_id": str(task.id),
                    "status": "created",
                    "title": task.title
                }
                return [TextContent(type="text", text=json.dumps(result))]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    async def _list_tasks(self, args: Dict[str, Any]) -> List[TextContent]:
        """List tasks with optional status filter."""
        try:
            async for db in get_db():
                query = select(Task).where(Task.user_id == UUID(args["user_id"]))
                
                status = args.get("status", "all")
                if status == "pending":
                    query = query.where(Task.completed == False)
                elif status == "completed":
                    query = query.where(Task.completed == True)
                
                result = await db.execute(query)
                tasks = result.scalars().all()
                
                task_list = [
                    {
                        "id": str(task.id),
                        "title": task.title,
                        "description": task.description,
                        "completed": task.completed,
                        "created_at": task.created_at.isoformat()
                    }
                    for task in tasks
                ]
                
                return [TextContent(type="text", text=json.dumps(task_list))]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    async def _complete_task(self, args: Dict[str, Any]) -> List[TextContent]:
        """Mark task as complete by ID or title."""
        try:
            async for db in get_db():
                query = select(Task).where(Task.user_id == UUID(args["user_id"]))
                
                # Search by task_id or title
                if "task_id" in args and args["task_id"]:
                    query = query.where(Task.id == UUID(args["task_id"]))
                elif "title" in args and args["title"]:
                    query = query.where(Task.title.ilike(f"%{args['title']}%"))
                else:
                    return [TextContent(type="text", text="Provide task_id or title")]
                
                result = await db.execute(query)
                task = result.scalar_one_or_none()
                
                if not task:
                    return [TextContent(type="text", text="Task not found")]
                
                task.completed = True
                await db.commit()
                
                result = {
                    "task_id": str(task.id),
                    "status": "completed",
                    "title": task.title
                }
                return [TextContent(type="text", text=json.dumps(result))]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    async def _delete_task(self, args: Dict[str, Any]) -> List[TextContent]:
        """Delete a task by ID or title."""
        try:
            async for db in get_db():
                query = select(Task).where(Task.user_id == UUID(args["user_id"]))
                
                # Search by task_id or title
                if "task_id" in args and args["task_id"]:
                    try:
                        query = query.where(Task.id == UUID(args["task_id"]))
                    except ValueError:
                        # If task_id is not a valid UUID, treat it as title
                        query = query.where(Task.title.ilike(f"%{args['task_id']}%"))
                elif "title" in args and args["title"]:
                    query = query.where(Task.title.ilike(f"%{args['title']}%"))
                else:
                    # If no specific field, check if any argument looks like a title
                    for key, value in args.items():
                        if key not in ["user_id"] and value:
                            query = query.where(Task.title.ilike(f"%{value}%"))
                            break
                    else:
                        return [TextContent(type="text", text="Provide task_id or title")]
                
                result = await db.execute(query)
                task = result.scalar_one_or_none()
                
                if not task:
                    return [TextContent(type="text", text="Task not found")]
                
                title = task.title
                task_id = str(task.id)
                await db.delete(task)
                await db.commit()
                
                result = {
                    "task_id": task_id,
                    "status": "deleted",
                    "title": title
                }
                return [TextContent(type="text", text=json.dumps(result))]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    async def _update_task(self, args: Dict[str, Any]) -> List[TextContent]:
        """Update task title or description by ID or current title."""
        try:
            async for db in get_db():
                query = select(Task).where(Task.user_id == UUID(args["user_id"]))
                
                # Search by task_id or current_title
                if "task_id" in args and args["task_id"]:
                    query = query.where(Task.id == UUID(args["task_id"]))
                elif "current_title" in args and args["current_title"]:
                    # First try exact match, then partial match
                    exact_query = query.where(Task.title == args["current_title"])
                    result = await db.execute(exact_query)
                    task = result.scalar_one_or_none()
                    
                    if not task:
                        # Try partial match if exact match fails
                        partial_query = query.where(Task.title.ilike(f"%{args['current_title']}%"))
                        result = await db.execute(partial_query)
                        task = result.scalar_one_or_none()
                else:
                    return [TextContent(type="text", text="Provide task_id or current_title")]
                
                if not task:
                    result = await db.execute(query)
                    task = result.scalar_one_or_none()
                
                if not task:
                    return [TextContent(type="text", text=json.dumps({
                        "status": "error",
                        "message": "Task not found"
                    }))]
                
                if "title" in args and args["title"]:
                    task.title = args["title"]
                if "description" in args and args["description"]:
                    task.description = args["description"]
                
                await db.commit()
                
                result = {
                    "task_id": str(task.id),
                    "status": "updated",
                    "title": task.title
                }
                return [TextContent(type="text", text=json.dumps(result))]
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({
                "status": "error",
                "message": str(e)
            }))]


# Global MCP server instance
mcp_server = TaskMCPServer()