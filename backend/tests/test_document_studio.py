"""
Test Document Studio API - AI Agents and Document Generation
Tests the /api/document/generate endpoint with different agents
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://groq-chat-preview.preview.emergentagent.com')

class TestDocumentStudioAPI:
    """Test Document Studio /api/document/generate endpoint"""
    
    def test_health_check(self):
        """Verify API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["groq"] == True
        print("✅ Health check passed")
    
    def test_document_generate_with_general_agent(self):
        """Test document generation with general AI agent"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Write a short thank you note",
                "document_type": "letter",
                "agent": "general"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "content" in data
        assert "file_url" in data
        assert len(data["content"]) > 50  # Should have substantial content
        print(f"✅ General agent generated document: {len(data['content'])} chars")
    
    def test_document_generate_with_lawyer_agent(self):
        """Test document generation with AI Lawyer agent"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Create a simple NDA",
                "document_type": "contract",
                "agent": "lawyer"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "content" in data
        assert "file_url" in data
        
        # Verify legal content (should contain legal terms)
        content_lower = data["content"].lower()
        legal_terms = ["agreement", "party", "confidential", "disclosure"]
        found_terms = [term for term in legal_terms if term in content_lower]
        assert len(found_terms) >= 2, f"Expected legal terms, found: {found_terms}"
        print(f"✅ Lawyer agent generated NDA with legal terms: {found_terms}")
    
    def test_document_generate_with_accountant_agent(self):
        """Test document generation with AI Accountant agent"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Create a simple invoice for consulting services",
                "document_type": "invoice",
                "agent": "accountant"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "content" in data
        
        # Verify invoice content
        content_lower = data["content"].lower()
        invoice_terms = ["invoice", "total", "amount", "payment"]
        found_terms = [term for term in invoice_terms if term in content_lower]
        assert len(found_terms) >= 2, f"Expected invoice terms, found: {found_terms}"
        print(f"✅ Accountant agent generated invoice with terms: {found_terms}")
    
    def test_document_generate_with_hr_agent(self):
        """Test document generation with AI HR agent"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Write a job description for a software engineer",
                "document_type": "pdf",
                "agent": "hr"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "content" in data
        
        # Verify HR content
        content_lower = data["content"].lower()
        hr_terms = ["responsibilities", "qualifications", "experience", "skills"]
        found_terms = [term for term in hr_terms if term in content_lower]
        assert len(found_terms) >= 2, f"Expected HR terms, found: {found_terms}"
        print(f"✅ HR agent generated job description with terms: {found_terms}")
    
    def test_document_generate_with_marketing_agent(self):
        """Test document generation with AI Marketing agent"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Write a product launch announcement",
                "document_type": "pdf",
                "agent": "marketing"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "content" in data
        assert len(data["content"]) > 100
        print(f"✅ Marketing agent generated announcement: {len(data['content'])} chars")
    
    def test_document_generate_with_academic_agent(self):
        """Test document generation with AI Academic agent"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Write an abstract for a research paper on AI",
                "document_type": "pdf",
                "agent": "academic"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "content" in data
        
        # Verify academic content
        content_lower = data["content"].lower()
        academic_terms = ["research", "study", "analysis", "methodology", "findings"]
        found_terms = [term for term in academic_terms if term in content_lower]
        assert len(found_terms) >= 1, f"Expected academic terms, found: {found_terms}"
        print(f"✅ Academic agent generated abstract with terms: {found_terms}")
    
    def test_document_generate_without_agent_defaults_to_general(self):
        """Test that missing agent parameter defaults to general"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Write a short memo",
                "document_type": "pdf"
                # No agent specified - should default to general
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        print("✅ Document generated without agent (defaults to general)")


class TestBuildPageAPI:
    """Test Build Page /api/build/generate endpoint"""
    
    def test_build_generate_code(self):
        """Test code generation for Build page"""
        response = requests.post(
            f"{BASE_URL}/api/build/generate",
            json={
                "prompt": "Add a footer with copyright text",
                "current_code": "<html><body><h1>Hello</h1></body></html>"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "code" in data
        assert len(data["code"]) > 50
        print(f"✅ Build generate returned code: {len(data['code'])} chars")
    
    def test_build_generate_new_website(self):
        """Test generating a new website from scratch"""
        response = requests.post(
            f"{BASE_URL}/api/build/generate",
            json={
                "prompt": "Create a simple landing page with a hero section"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "code" in data
        # Should contain HTML structure
        code_lower = data["code"].lower()
        assert "<html" in code_lower or "<div" in code_lower or "class=" in code_lower
        print(f"✅ Build generate created new website: {len(data['code'])} chars")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
