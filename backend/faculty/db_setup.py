from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Create engine
DATABASE_URL = "sqlite:///./learning_platform.db"  # Adjust this URL as needed
engine = create_engine(DATABASE_URL)

# Create declarative base
Base = declarative_base()

# Create SessionLocal
SessionLocal = sessionmaker(bind=engine)

# Define your models
class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    
    # Relationship to chunks
    chunks = relationship("DocumentChunk", back_populates="document")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    chunk_index = Column(Integer)
    content = Column(Text)
    
    # Relationship to document
    document = relationship("Document", back_populates="chunks")