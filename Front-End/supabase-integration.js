// This script demonstrates how to integrate Supabase with the WorkMatrix FastAPI backend

const fs = require('fs');
const path = require('path');

// Display the integration steps
console.log("# Integrating Supabase with WorkMatrix Backend\n");

// Step 1: Install required packages
console.log("## Step 1: Install Required Packages\n");
console.log("```bash");
console.log("pip install supabase python-dotenv");
console.log("```\n");

// Step 2: Set up environment variables
console.log("## Step 2: Update Environment Variables\n");
console.log("Add these variables to your .env file:\n");
console.log("```");
console.log("SUPABASE_URL=https://your-project-id.supabase.co");
console.log("SUPABASE_KEY=your-supabase-anon-key");
console.log("SUPABASE_SERVICE_KEY=your-supabase-service-role-key");
console.log("```\n");

// Step 3: Create Supabase client
console.log("## Step 3: Create Supabase Client\n");
console.log("Create a new file `app/db/supabase.py`:\n");
console.log("```python");
console.log(getSupabaseClientFile());
console.log("```\n");

// Step 4: Update database models
console.log("## Step 4: Update Database Models\n");
console.log("Modify your models to work with Supabase. Here's an example for the User model:\n");
console.log("```python");
console.log(getUpdatedUserModelFile());
console.log("```\n");

// Step 5: Create repository pattern for data access
console.log("## Step 5: Create Repository Pattern\n");
console.log("Create a repository layer to abstract database operations:\n");
console.log("```python");
console.log(getUserRepositoryFile());
console.log("```\n");

// Step 6: Update API endpoints
console.log("## Step 6: Update API Endpoints\n");
console.log("Update your API endpoints to use the repository. Example for users.py:\n");
console.log("```python");
console.log(getUpdatedUsersAPIFile());
console.log("```\n");

// Step 7: Set up Supabase Auth
console.log("## Step 7: Set Up Supabase Auth\n");
console.log("Create an auth service to handle authentication with Supabase:\n");
console.log("```python");
console.log(getSupabaseAuthServiceFile());
console.log("```\n");

// Step 8: Set up Supabase Storage
console.log("## Step 8: Set Up Supabase Storage\n");
console.log("Create a storage service for screenshots:\n");
console.log("```python");
console.log(getSupabaseStorageServiceFile());
console.log("```\n");

// Step 9: Set up Supabase Realtime
console.log("## Step 9: Set Up Supabase Realtime\n");
console.log("Create a service for real-time updates:\n");
console.log("```python");
console.log(getSupabaseRealtimeServiceFile());
console.log("```\n");

// Step 10: Update main.py
console.log("## Step 10: Update main.py\n");
console.log("Update your main.py file to use Supabase:\n");
console.log("```python");
console.log(getUpdatedMainFile());
console.log("```\n");

// Step 11: Create Supabase migration script
console.log("## Step 11: Create Supabase Migration Script\n");
console.log("Create a script to set up your Supabase tables and policies:\n");
console.log("```sql");
console.log(getSupabaseMigrationScript());
console.log("```\n");

// Step 12: Testing the integration
console.log("## Step 12: Testing the Integration\n");
console.log("Create a test script to verify the Supabase connection:\n");
console.log("```python");
console.log(getSupabaseTestScript());
console.log("```\n");

// Function to generate file content
function getSupabaseClientFile() {
  return `import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Get Supabase credentials from environment variables
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase_service_key = os.environ.get("SUPABASE_SERVICE_KEY")

# Create Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

# Create Supabase admin client with service role key for admin operations
supabase_admin: Client = create_client(supabase_url, supabase_service_key)

def get_supabase_client():
    """
    Returns the Supabase client instance.
    """
    return supabase

def get_supabase_admin_client():
    """
    Returns the Supabase admin client instance with service role key.
    """
    return supabase_admin`;
}

function getUpdatedUserModelFile() {
  return `from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, validator

# Pydantic model for User
class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "employee"
    is_active: bool = True
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        orm_mode = True

    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ["employee", "admin", "manager"]
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of {allowed_roles}")
        return v
        
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the model to a dictionary for Supabase.
        """
        return {
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else datetime.now().isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """
        Create a User instance from a dictionary.
        """
        return cls(
            id=data.get("id"),
            email=data.get("email"),
            full_name=data.get("full_name"),
            role=data.get("role", "employee"),
            is_active=data.get("is_active", True),
            created_at=datetime.fromisoformat(data.get("created_at")) if data.get("created_at") else None,
            last_login=datetime.fromisoformat(data.get("last_login")) if data.get("last_login") else None
        )`;
}

function getUserRepositoryFile() {
  return `from typing import List, Optional, Dict, Any
from datetime import datetime

from app.db.supabase import get_supabase_client, get_supabase_admin_client
from app.models.user import User

class UserRepository:
    """
    Repository for User operations with Supabase.
    """
    
    @staticmethod
    async def create(user: User) -> User:
        """
        Create a new user in Supabase.
        """
        supabase = get_supabase_admin_client()
        
        # Insert user data
        response = supabase.table("users").insert(user.to_dict()).execute()
        
        if len(response.data) > 0:
            return User.from_dict(response.data[0])
        else:
            raise Exception("Failed to create user")
    
    @staticmethod
    async def get_by_id(user_id: str) -> Optional[User]:
        """
        Get a user by ID.
        """
        supabase = get_supabase_client()
        
        response = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if len(response.data) > 0:
            return User.from_dict(response.data[0])
        else:
            return None
    
    @staticmethod
    async def get_by_email(email: str) -> Optional[User]:
        """
        Get a user by email.
        """
        supabase = get_supabase_client()
        
        response = supabase.table("users").select("*").eq("email", email).execute()
        
        if len(response.data) > 0:
            return User.from_dict(response.data[0])
        else:
            return None
    
    @staticmethod
    async def update(user_id: str, data: Dict[str, Any]) -> Optional[User]:
        """
        Update a user.
        """
        supabase = get_supabase_client()
        
        response = supabase.table("users").update(data).eq("id", user_id).execute()
        
        if len(response.data) > 0:
            return User.from_dict(response.data[0])
        else:
            return None
    
    @staticmethod
    async def delete(user_id: str) -> bool:
        """
        Delete a user.
        """
        supabase = get_supabase_admin_client()
        
        response = supabase.table("users").delete().eq("id", user_id).execute()
        
        return len(response.data) > 0
    
    @staticmethod
    async def list(skip: int = 0, limit: int = 100) -> List[User]:
        """
        List users with pagination.
        """
        supabase = get_supabase_client()
        
        response = supabase.table("users").select("*").range(skip, skip + limit - 1).execute()
        
        return [User.from_dict(item) for item in response.data]
    
    @staticmethod
    async def update_last_login(user_id: str) -> None:
        """
        Update the last login timestamp for a user.
        """
        supabase = get_supabase_client()
        
        supabase.table("users").update({
            "last_login": datetime.now().isoformat()
        }).eq("id", user_id).execute()`;
}

function getUpdatedUsersAPIFile() {
  return `from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Any

from app.core.security import create_access_token, get_password_hash, verify_password, get_current_user
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserResponse, Token, UserUpdate
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register_user(user_in: UserCreate):
    """
    Register a new user.
    """
    # Check if user already exists
    existing_user = await UserRepository.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Register user with Supabase Auth
    auth_user = await AuthService.register(user_in.email, user_in.password)
    
    # Create user in our users table
    user = User(
        id=auth_user.id,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
    )
    
    created_user = await UserRepository.create(user)
    return UserResponse.from_orm(created_user)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Authenticate with Supabase Auth
    auth_response = await AuthService.login(form_data.username, form_data.password)
    
    # Get user from our users table
    user = await UserRepository.get_by_email(form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login time
    await UserRepository.update_last_login(user.id)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user.
    """
    return UserResponse.from_orm(current_user)

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Update own user.
    """
    update_data = user_in.dict(exclude_unset=True)
    
    if user_in.password:
        # Update password in Supabase Auth
        await AuthService.update_password(current_user.id, user_in.password)
        # Remove password from update data for our users table
        update_data.pop("password", None)
    
    if update_data:
        updated_user = await UserRepository.update(current_user.id, update_data)
        if updated_user:
            return UserResponse.from_orm(updated_user)
    
    return UserResponse.from_orm(current_user)

@router.get("/role-check")
async def check_role(current_user: User = Depends(get_current_user)):
    """
    Check user role.
    """
    return {"role": current_user.role}`;
}

function getSupabaseAuthServiceFile() {
  return `from typing import Optional, Dict, Any
from datetime import datetime

from app.db.supabase import get_supabase_client, get_supabase_admin_client

class AuthUser:
    """
    Represents a user from Supabase Auth.
    """
    def __init__(self, id: str, email: str):
        self.id = id
        self.email = email

class AuthService:
    """
    Service for authentication operations with Supabase Auth.
    """
    
    @staticmethod
    async def register(email: str, password: str) -> AuthUser:
        """
        Register a new user with Supabase Auth.
        """
        supabase = get_supabase_client()
        
        # Sign up user
        response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        
        if response.user:
            return AuthUser(id=response.user.id, email=response.user.email)
        else:
            raise Exception("Failed to register user")
    
    @staticmethod
    async def login(email: str, password: str) -> Dict[str, Any]:
        """
        Login a user with Supabase Auth.
        """
        supabase = get_supabase_client()
        
        # Sign in user
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if response.user:
            return {
                "user": AuthUser(id=response.user.id, email=response.user.email),
                "session": response.session
            }
        else:
            raise Exception("Failed to login user")
    
    @staticmethod
    async def logout(jwt: str) -> None:
        """
        Logout a user from Supabase Auth.
        """
        supabase = get_supabase_client()
        
        # Sign out user
        supabase.auth.sign_out()
    
    @staticmethod
    async def get_user(jwt: str) -> Optional[AuthUser]:
        """
        Get a user from Supabase Auth using JWT.
        """
        supabase = get_supabase_client()
        
        # Get user
        user = supabase.auth.get_user(jwt)
        
        if user:
            return AuthUser(id=user.id, email=user.email)
        else:
            return None
    
    @staticmethod
    async def update_password(user_id: str, new_password: str) -> None:
        """
        Update a user's password in Supabase Auth.
        """
        supabase_admin = get_supabase_admin_client()
        
        # Update user password
        supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {"password": new_password}
        )
    
    @staticmethod
    async def delete_user(user_id: str) -> None:
        """
        Delete a user from Supabase Auth.
        """
        supabase_admin = get_supabase_admin_client()
        
        # Delete user
        supabase_admin.auth.admin.delete_user(user_id)`;
}

function getSupabaseStorageServiceFile() {
  return `import os
from typing import Optional, BinaryIO
from datetime import datetime, timedelta

from app.db.supabase import get_supabase_client

class StorageService:
    """
    Service for storage operations with Supabase Storage.
    """
    
    BUCKET_NAME = "screenshots"
    
    @staticmethod
    async def init_bucket():
        """
        Initialize the screenshots bucket if it doesn't exist.
        """
        supabase = get_supabase_client()
        
        # Check if bucket exists
        buckets = supabase.storage.list_buckets()
        bucket_exists = any(bucket.name == StorageService.BUCKET_NAME for bucket in buckets)
        
        if not bucket_exists:
            # Create bucket
            supabase.storage.create_bucket(
                StorageService.BUCKET_NAME,
                {"public": False}  # Private bucket
            )
    
    @staticmethod
    async def upload_file(
        file_content: BinaryIO,
        file_path: str,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload a file to Supabase Storage.
        
        Args:
            file_content: The file content as bytes
            file_path: The path where the file will be stored
            content_type: The content type of the file
            
        Returns:
            The URL of the uploaded file
        """
        supabase = get_supabase_client()
        
        # Ensure bucket exists
        await StorageService.init_bucket()
        
        # Upload file
        response = supabase.storage.from_(StorageService.BUCKET_NAME).upload(
            file_path,
            file_content,
            {"content-type": content_type} if content_type else None
        )
        
        # Return file URL
        return supabase.storage.from_(StorageService.BUCKET_NAME).get_public_url(file_path)
    
    @staticmethod
    async def download_file(file_path: str) -> bytes:
        """
        Download a file from Supabase Storage.
        
        Args:
            file_path: The path of the file to download
            
        Returns:
            The file content as bytes
        """
        supabase = get_supabase_client()
        
        # Download file
        response = supabase.storage.from_(StorageService.BUCKET_NAME).download(file_path)
        
        return response
    
    @staticmethod
    async def delete_file(file_path: str) -> None:
        """
        Delete a file from Supabase Storage.
        
        Args:
            file_path: The path of the file to delete
        """
        supabase = get_supabase_client()
        
        # Delete file
        supabase.storage.from_(StorageService.BUCKET_NAME).remove([file_path])
    
    @staticmethod
    async def get_signed_url(file_path: str, expires_in: int = 60) -> str:
        """
        Get a signed URL for a file in Supabase Storage.
        
        Args:
            file_path: The path of the file
            expires_in: The number of seconds until the URL expires
            
        Returns:
            The signed URL
        """
        supabase = get_supabase_client()
        
        # Get signed URL
        response = supabase.storage.from_(StorageService.BUCKET_NAME).create_signed_url(
            file_path,
            expires_in
        )
        
        return response["signedURL"]`;
}

function getSupabaseRealtimeServiceFile() {
  return `from typing import Callable, Dict, Any, List
import json
import asyncio

from app.db.supabase import get_supabase_client

class RealtimeService:
    """
    Service for real-time operations with Supabase Realtime.
    """
    
    @staticmethod
    async def subscribe_to_table(
        table_name: str,
        callback: Callable[[Dict[str, Any]], None],
        event_type: str = "*"
    ) -> str:
        """
        Subscribe to changes on a table.
        
        Args:
            table_name: The name of the table to subscribe to
            callback: The function to call when an event occurs
            event_type: The type of event to subscribe to (INSERT, UPDATE, DELETE, or * for all)
            
        Returns:
            The subscription ID
        """
        supabase = get_supabase_client()
        
        # Subscribe to table changes
        channel = supabase.channel('db-changes')
        
        channel.on(
            'postgres_changes',
            {
                'event': event_type,
                'schema': 'public',
                'table': table_name
            },
            lambda payload: callback(payload)
        )
        
        channel.subscribe()
        
        return channel.id
    
    @staticmethod
    async def unsubscribe(subscription_id: str) -> None:
        """
        Unsubscribe from a subscription.
        
        Args:
            subscription_id: The ID of the subscription to unsubscribe from
        """
        supabase = get_supabase_client()
        
        # Unsubscribe from channel
        supabase.remove_channel(subscription_id)
    
    @staticmethod
    async def broadcast_message(
        channel: str,
        event: str,
        payload: Dict[str, Any]
    ) -> None:
        """
        Broadcast a message to a channel.
        
        Args:
            channel: The channel to broadcast to
            event: The event name
            payload: The payload to send
        """
        supabase = get_supabase_client()
        
        # Create channel
        channel_instance = supabase.channel(channel)
        
        # Subscribe to channel
        channel_instance.subscribe()
        
        # Broadcast message
        channel_instance.send(
            event=event,
            payload=payload
        )
        
        # Wait a moment to ensure message is sent
        await asyncio.sleep(0.1)
        
        # Remove channel
        supabase.remove_channel(channel_instance.id)`;
}

function getUpdatedMainFile() {
  return `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from app.api import users, employees, admin, timelogs, screenshots, keystrokes, tickets
from app.core.config import settings
from app.db.supabase import get_supabase_client

# Load environment variables
load_dotenv()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="WorkMatrix API - Employee Monitoring System",
    version="1.0.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(timelogs.router, prefix="/api/timelogs", tags=["timelogs"])
app.include_router(screenshots.router, prefix="/api/screenshots", tags=["screenshots"])
app.include_router(keystrokes.router, prefix="/api/keystrokes", tags=["keystrokes"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["tickets"])

@app.get("/")
async def root():
    return {"message": "Welcome to WorkMatrix API"}

@app.on_event("startup")
async def startup_event():
    """
    Initialize services on startup.
    """
    # Test Supabase connection
    supabase = get_supabase_client()
    try:
        # Simple query to test connection
        response = supabase.table("users").select("count", count="exact").execute()
        print(f"Connected to Supabase. Users count: {response.count}")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")`;
}

function getSupabaseMigrationScript() {
  return `-- Create tables

-- Users table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'employee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Employees table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) NOT NULL UNIQUE,
    department TEXT,
    job_title TEXT,
    manager_id UUID REFERENCES public.employees(id),
    hire_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    location TEXT,
    phone_number TEXT
);

-- Time logs table
CREATE TABLE public.time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes FLOAT,
    activity_type TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screenshots table
CREATE TABLE public.screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    capture_time TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keystrokes table
CREATE TABLE public.keystrokes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    application_name TEXT,
    window_title TEXT,
    count INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX idx_time_logs_start_time ON public.time_logs(start_time);
CREATE INDEX idx_screenshots_user_id ON public.screenshots(user_id);
CREATE INDEX idx_screenshots_capture_time ON public.screenshots(capture_time);
CREATE INDEX idx_keystrokes_user_id ON public.keystrokes(user_id);
CREATE INDEX idx_keystrokes_timestamp ON public.keystrokes(timestamp);
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);

-- Set up Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keystrokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Users table policies
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Similar policies for other tables...

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', false);

-- Set up storage policies
CREATE POLICY "Users can upload their own screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'screenshots' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'screenshots' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Admins can view all screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'screenshots' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can delete their own screenshots" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'screenshots' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );`;
}

function getSupabaseTestScript() {
  return `import os
import asyncio
from dotenv import load_dotenv

from app.db.supabase import get_supabase_client

# Load environment variables
load_dotenv()

async def test_supabase_connection():
    """
    Test the connection to Supabase.
    """
    print("Testing Supabase connection...")
    
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Test query
        response = supabase.table("users").select("count", count="exact").execute()
        
        print(f"Connection successful! Users count: {response.count}")
        
        # Test auth
        auth_response = supabase.auth.get_user()
        if auth_response.user:
            print(f"Authenticated as: {auth_response.user.email}")
        else:
            print("Not authenticated")
        
        # Test storage
        buckets = supabase.storage.list_buckets()
        print(f"Storage buckets: {[bucket.name for bucket in buckets]}")
        
        return True
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_supabase_connection())`;
}

console.log("\n## Complete Supabase Integration Guide\n");
console.log("Follow these steps to fully integrate Supabase with your WorkMatrix backend. This will replace the direct PostgreSQL connection with Supabase's powerful features including authentication, database, storage, and real-time capabilities.");
