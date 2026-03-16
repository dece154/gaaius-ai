"""
GAAIUS AI Backend Tests - Testing core APIs
Features tested:
- Health check endpoint
- Chat API functionality  
- Image generation with fallback providers
- Audio generation with voice/language params
- Session management
- File generation
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_returns_healthy(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['groq'] == True
        assert data['huggingface'] == True
        print(f"✅ Health check passed: {data}")


class TestChatAPI:
    """Chat API endpoint tests"""
    
    @pytest.fixture
    def session_id(self):
        """Create a test session and return its ID"""
        response = requests.post(f"{BASE_URL}/api/sessions?name=Test_Chat_Session", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert 'id' in data
        return data['id']
    
    def test_chat_endpoint_works(self, session_id):
        """Test /api/chat returns AI response"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"session_id": session_id, "message": "Hello, respond with just 'test passed'"},
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        assert 'content' in data
        assert 'id' in data
        assert len(data['content']) > 0
        print(f"✅ Chat API passed, response length: {len(data['content'])}")
    
    def test_chat_history_retrieval(self, session_id):
        """Test retrieving chat history"""
        # First send a message
        requests.post(
            f"{BASE_URL}/api/chat",
            json={"session_id": session_id, "message": "Test message for history"},
            timeout=60
        )
        
        # Then get history
        response = requests.get(f"{BASE_URL}/api/chat/{session_id}/history", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Chat history retrieval passed, messages: {len(data)}")


class TestImageGeneration:
    """Image generation with fallback providers tests"""
    
    def test_image_generate_endpoint(self):
        """Test /api/image/generate works with fallback providers (Pollinations -> HuggingFace)"""
        response = requests.post(
            f"{BASE_URL}/api/image/generate",
            json={"prompt": "A simple blue circle on white background"},
            timeout=120  # Image generation can take time
        )
        assert response.status_code == 200
        data = response.json()
        assert 'image_url' in data
        assert 'model_used' in data
        assert data['model_used'] in ['Pollinations AI', 'HuggingFace SDXL', 'HuggingFace FLUX']
        print(f"✅ Image generation passed, model: {data['model_used']}, url: {data['image_url']}")


class TestAudioGeneration:
    """Audio generation tests with voice/language params"""
    
    def test_audio_generate_basic(self):
        """Test /api/audio/generate with basic prompt"""
        response = requests.post(
            f"{BASE_URL}/api/audio/generate",
            json={"prompt": "Say hello world", "duration": 5, "type": "music"},
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        assert 'audio_url' in data
        assert 'content' in data
        print(f"✅ Audio generation basic passed, url: {data['audio_url']}")
    
    def test_audio_generate_with_voice_language(self):
        """Test /api/audio/generate accepts voice and language params"""
        response = requests.post(
            f"{BASE_URL}/api/audio/generate",
            json={
                "prompt": "Tell me a short story about a cat",
                "duration": 10,
                "type": "music",
                "voice": "female",
                "language": "en"
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        assert 'audio_url' in data
        assert 'voice' in data
        assert 'language' in data
        print(f"✅ Audio with voice/language passed - voice: {data['voice']}, language: {data['language']}")
    
    def test_audio_generate_auto_language(self):
        """Test /api/audio/generate with auto language detection (empty string)"""
        response = requests.post(
            f"{BASE_URL}/api/audio/generate",
            json={
                "prompt": "A short English greeting",
                "duration": 5,
                "type": "music",
                "voice": "default",
                "language": ""  # Auto-detect
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        assert 'audio_url' in data
        print(f"✅ Audio auto-language passed")


class TestSessionManagement:
    """Session CRUD operations tests"""
    
    def test_create_session(self):
        """Test creating a new session"""
        response = requests.post(f"{BASE_URL}/api/sessions?name=TEST_Session", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert 'id' in data
        assert data['name'] == 'TEST_Session'
        print(f"✅ Session created: {data['id']}")
        return data['id']
    
    def test_get_sessions(self):
        """Test listing sessions"""
        response = requests.get(f"{BASE_URL}/api/sessions", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Sessions list retrieved, count: {len(data)}")
    
    def test_delete_session(self):
        """Test deleting a session"""
        # Create first
        create_response = requests.post(f"{BASE_URL}/api/sessions?name=TEST_Delete_Session", timeout=10)
        session_id = create_response.json()['id']
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/sessions/{session_id}", timeout=10)
        assert delete_response.status_code == 200
        print(f"✅ Session deleted: {session_id}")


class TestGenerationsEndpoint:
    """Test generations list endpoint"""
    
    def test_get_generations(self):
        """Test /api/generations returns list"""
        response = requests.get(f"{BASE_URL}/api/generations", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Generations retrieved, count: {len(data)}")


class TestTTSEndpoint:
    """Test TTS/speak endpoint"""
    
    def test_tts_speak(self):
        """Test /api/tts/speak for text-to-speech"""
        response = requests.post(
            f"{BASE_URL}/api/tts/speak",
            json={"text": "Hello world", "lang": "en"},
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        assert 'audio_url' in data
        print(f"✅ TTS speak passed, url: {data['audio_url']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
