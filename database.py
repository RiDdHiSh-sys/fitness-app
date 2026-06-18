import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "fitness_app_db")

# --- In-Memory Mock Database Fallback for Sandboxed/Local Testing ---
class MockCollection:
    def __init__(self, name):
        self.name = name
        self.documents = []
        
    async def insert_one(self, doc):
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.documents.append(doc)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])
        
    async def find_one(self, query, sort=None):
        docs = self.documents
        if sort:
            field, direction = sort[0]
            docs = sorted(docs, key=lambda x: x.get(field) or datetime.min, reverse=(direction == -1))
        
        for doc in docs:
            match = True
            for k, v in query.items():
                if isinstance(v, dict):
                    doc_val = doc.get(k)
                    if "$gte" in v and (doc_val is None or doc_val < v["$gte"]): match = False
                    if "$lte" in v and (doc_val is None or doc_val > v["$lte"]): match = False
                    if "$lt" in v and (doc_val is None or doc_val >= v["$lt"]): match = False
                elif doc.get(k) != v:
                    match = False
            if match:
                return doc
        return None
        
    def find(self, query):
        matched = []
        for doc in self.documents:
            match = True
            for k, v in query.items():
                if isinstance(v, dict):
                    doc_val = doc.get(k)
                    if "$gte" in v and (doc_val is None or doc_val < v["$gte"]): match = False
                    if "$lte" in v and (doc_val is None or doc_val > v["$lte"]): match = False
                    if "$lt" in v and (doc_val is None or doc_val >= v["$lt"]): match = False
                elif doc.get(k) != v:
                    match = False
            if match:
                matched.append(doc)
                
        class MockCursor:
            def __init__(self, items):
                self.items = items
            async def to_list(self, length=100):
                return self.items
        return MockCursor(matched)
        
    async def update_one(self, query, update):
        doc = await self.find_one(query)
        if not doc:
            return
        if "$set" in update:
            for k, v in update["$set"].items():
                doc[k] = v
        if "$push" in update:
            for k, v in update["$push"].items():
                if k not in doc:
                    doc[k] = []
                doc[k].append(v)

class MockDatabase:
    def __init__(self):
        self.collections = {}
        
    def __getattr__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

# --- Database Client Setup ---
class Database:
    client = None
    db = None

db_helper = Database()

def get_db():
    if db_helper.db is None:
        db_helper.client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
        db_helper.db = db_helper.client[DATABASE_NAME]
    return db_helper.db

async def connect_to_mongo():
    try:
        db_helper.client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
        db_helper.db = db_helper.client[DATABASE_NAME]
        # Ping the admin database to check connectivity
        await db_helper.client.admin.command('ping')
        print(f"Successfully connected to MongoDB: {DATABASE_NAME}")
    except Exception as e:
        print(f"MongoDB connection failed: {e}. Falling back to dynamic in-memory mock database.")
        db_helper.client = None
        db_helper.db = MockDatabase()

async def close_mongo_connection():
    if db_helper.client:
        db_helper.client.close()
        print("Closed MongoDB connection")
