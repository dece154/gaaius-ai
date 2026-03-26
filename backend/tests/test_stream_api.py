"""
Test Stream API endpoints - Netflix-style video hub
Tests: /api/stream/categories, /api/stream/browse, /api/stream/search, /api/stream/category/{id}
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://groq-chat-preview.preview.emergentagent.com')

class TestStreamAPI:
    """Stream API endpoint tests"""
    
    def test_health_check(self):
        """Verify backend is running"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ Health check passed")
    
    def test_stream_categories_returns_18_categories(self):
        """Test /api/stream/categories returns 18 categories"""
        response = requests.get(f"{BASE_URL}/api/stream/categories", timeout=15)
        assert response.status_code == 200
        data = response.json()
        
        # Should return 18 categories
        assert isinstance(data, list)
        assert len(data) == 18, f"Expected 18 categories, got {len(data)}"
        
        # Each category should have id and name
        for cat in data:
            assert "id" in cat
            assert "name" in cat
        
        # Check some expected categories exist
        category_ids = [c["id"] for c in data]
        expected_ids = ["featured", "documentaries", "comedy", "horror", "scifi", "animation"]
        for expected in expected_ids:
            assert expected in category_ids, f"Missing category: {expected}"
        
        print(f"✅ Stream categories returned {len(data)} categories")
        print(f"   Categories: {[c['name'] for c in data[:6]]}...")
    
    def test_stream_browse_returns_category_rows(self):
        """Test /api/stream/browse returns multiple category rows with videos"""
        response = requests.get(f"{BASE_URL}/api/stream/browse?rows=6", timeout=30)
        assert response.status_code == 200
        data = response.json()
        
        # Should return list of category rows
        assert isinstance(data, list)
        assert len(data) >= 1, "Should return at least 1 category row"
        
        # Each row should have id, name, and videos
        for row in data:
            assert "id" in row
            assert "name" in row
            assert "videos" in row
            assert isinstance(row["videos"], list)
        
        # Check first row has videos
        first_row = data[0]
        print(f"✅ Stream browse returned {len(data)} category rows")
        print(f"   First row '{first_row['name']}' has {len(first_row['videos'])} videos")
        
        # Verify video structure if videos exist
        if first_row["videos"]:
            video = first_row["videos"][0]
            assert "id" in video
            assert "title" in video
            assert "thumbnail" in video
            assert "embed_url" in video
            print(f"   Sample video: {video['title'][:50]}...")
    
    def test_stream_search_returns_results(self):
        """Test /api/stream/search?q=charlie returns search results"""
        response = requests.get(f"{BASE_URL}/api/stream/search?q=charlie", timeout=20)
        assert response.status_code == 200
        data = response.json()
        
        # Should have videos, total, page, query
        assert "videos" in data
        assert "total" in data
        assert "query" in data
        assert data["query"] == "charlie"
        
        # Should return some results for "charlie" (Charlie Chaplin films)
        assert isinstance(data["videos"], list)
        print(f"✅ Stream search for 'charlie' returned {len(data['videos'])} videos (total: {data['total']})")
        
        # Verify video structure
        if data["videos"]:
            video = data["videos"][0]
            assert "id" in video
            assert "title" in video
            assert "embed_url" in video
            print(f"   First result: {video['title'][:50]}...")
    
    def test_stream_category_comedy_returns_videos(self):
        """Test /api/stream/category/comedy returns comedy videos"""
        response = requests.get(f"{BASE_URL}/api/stream/category/comedy?per_page=25", timeout=20)
        assert response.status_code == 200
        data = response.json()
        
        # Should have category, videos, page
        assert "category" in data
        assert "videos" in data
        assert "page" in data
        assert data["category"] == "Comedy"
        
        assert isinstance(data["videos"], list)
        print(f"✅ Stream category 'comedy' returned {len(data['videos'])} videos")
        
        # Verify video structure
        if data["videos"]:
            video = data["videos"][0]
            assert "id" in video
            assert "title" in video
            assert "thumbnail" in video
            assert "embed_url" in video
            print(f"   Sample: {video['title'][:50]}...")
    
    def test_stream_category_documentaries(self):
        """Test /api/stream/category/documentaries"""
        response = requests.get(f"{BASE_URL}/api/stream/category/documentaries?per_page=10", timeout=20)
        assert response.status_code == 200
        data = response.json()
        
        assert "category" in data
        assert data["category"] == "Documentaries"
        assert "videos" in data
        print(f"✅ Stream category 'documentaries' returned {len(data['videos'])} videos")
    
    def test_stream_category_invalid_returns_404(self):
        """Test /api/stream/category/invalid returns 404"""
        response = requests.get(f"{BASE_URL}/api/stream/category/invalid_category_xyz", timeout=10)
        assert response.status_code == 404
        print("✅ Invalid category correctly returns 404")
    
    def test_video_structure_has_required_fields(self):
        """Verify video objects have all required fields for UI"""
        response = requests.get(f"{BASE_URL}/api/stream/browse?rows=1", timeout=20)
        assert response.status_code == 200
        data = response.json()
        
        if data and data[0]["videos"]:
            video = data[0]["videos"][0]
            required_fields = ["id", "title", "creator", "thumbnail", "embed_url", "watch_url"]
            for field in required_fields:
                assert field in video, f"Missing required field: {field}"
            
            # Verify URL formats
            assert video["thumbnail"].startswith("https://archive.org/services/img/")
            assert video["embed_url"].startswith("https://archive.org/embed/")
            assert video["watch_url"].startswith("https://archive.org/details/")
            
            print(f"✅ Video structure verified with all required fields")
            print(f"   ID: {video['id']}")
            print(f"   Title: {video['title'][:40]}...")
            print(f"   Thumbnail: {video['thumbnail'][:50]}...")
            print(f"   Embed URL: {video['embed_url'][:50]}...")


class TestDocumentStudioTemplates:
    """Test Document Studio agent-specific templates"""
    
    def test_document_generate_with_lawyer_agent(self):
        """Test document generation with lawyer agent returns legal content"""
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
        
        assert "content" in data
        content_lower = data["content"].lower()
        # Legal documents should contain legal terms
        legal_terms = ["agreement", "party", "parties", "confidential", "disclose"]
        found_terms = [t for t in legal_terms if t in content_lower]
        assert len(found_terms) >= 2, f"Expected legal terms, found: {found_terms}"
        print(f"✅ Lawyer agent generated legal document with terms: {found_terms}")
    
    def test_document_generate_with_accountant_agent(self):
        """Test document generation with accountant agent returns financial content"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Create a simple invoice for $500 consulting",
                "document_type": "invoice",
                "agent": "accountant"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "content" in data
        content_lower = data["content"].lower()
        # Financial documents should contain financial terms
        financial_terms = ["invoice", "total", "amount", "payment", "due", "$", "500"]
        found_terms = [t for t in financial_terms if t in content_lower]
        assert len(found_terms) >= 2, f"Expected financial terms, found: {found_terms}"
        print(f"✅ Accountant agent generated financial document with terms: {found_terms}")
    
    def test_document_generate_with_hr_agent(self):
        """Test document generation with HR agent returns HR content"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Create a job description for software engineer",
                "document_type": "pdf",
                "agent": "hr"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "content" in data
        content_lower = data["content"].lower()
        # HR documents should contain HR terms
        hr_terms = ["position", "responsibilities", "qualifications", "experience", "skills", "job"]
        found_terms = [t for t in hr_terms if t in content_lower]
        assert len(found_terms) >= 2, f"Expected HR terms, found: {found_terms}"
        print(f"✅ HR agent generated HR document with terms: {found_terms}")
    
    def test_document_generate_with_marketing_agent(self):
        """Test document generation with marketing agent"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Create a product launch announcement",
                "document_type": "pdf",
                "agent": "marketing"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "content" in data
        content_lower = data["content"].lower()
        marketing_terms = ["launch", "product", "feature", "customer", "market", "announce"]
        found_terms = [t for t in marketing_terms if t in content_lower]
        assert len(found_terms) >= 2, f"Expected marketing terms, found: {found_terms}"
        print(f"✅ Marketing agent generated marketing document with terms: {found_terms}")
    
    def test_document_generate_with_academic_agent(self):
        """Test document generation with academic agent"""
        response = requests.post(
            f"{BASE_URL}/api/document/generate",
            json={
                "prompt": "Create a research abstract about AI",
                "document_type": "pdf",
                "agent": "academic"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "content" in data
        content_lower = data["content"].lower()
        academic_terms = ["research", "study", "abstract", "methodology", "findings", "analysis"]
        found_terms = [t for t in academic_terms if t in content_lower]
        assert len(found_terms) >= 2, f"Expected academic terms, found: {found_terms}"
        print(f"✅ Academic agent generated academic document with terms: {found_terms}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
