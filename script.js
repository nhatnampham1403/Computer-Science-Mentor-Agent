class Chatbot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.sessionId = null;
        this.isProcessing = false;
        this.conversationsDropdown = document.getElementById('conversationsDropdown');
        this.conversationsList = document.getElementById('conversationsList');
        this.currentSessionId = document.getElementById('currentSessionId');
        this.newChatButton = document.getElementById('newChatButton');
        
        this.initializeEventListeners();
        this.addWelcomeMessage();
        this.loadConversations();
    }
    
    initializeEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter key press
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Input focus for better UX
        this.messageInput.addEventListener('focus', () => {
            this.messageInput.parentElement.style.boxShadow = '6px 6px 0 #000000';
            this.messageInput.parentElement.style.transform = 'translate(-2px, -2px)';
        });
        
        this.messageInput.addEventListener('blur', () => {
            this.messageInput.parentElement.style.boxShadow = '4px 4px 0 #000000';
            this.messageInput.parentElement.style.transform = 'translate(0, 0)';
        });
        
        // New chat button
        this.newChatButton.addEventListener('click', () => this.startNewChat());
        
        // Dropdown hover events
        this.conversationsDropdown.addEventListener('mouseenter', () => {
            this.loadConversations();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.conversationsDropdown.contains(e.target)) {
                this.conversationsDropdown.querySelector('.dropdown-content').style.display = 'none';
            }
        });
    }
    
    addWelcomeMessage() {
        const welcomeMessage = {
            type: 'bot',
            content: "Welcome you to the system. I'm Nam's Assistant. How may I be of service today?"
        };
        this.addMessage(welcomeMessage);
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;
        
        // Add user message
        this.addMessage({
            type: 'user',
            content: message
        });
        
        // Clear input
        this.messageInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        this.isProcessing = true;
        this.sendButton.disabled = true;
        
        try {
            // Send message to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }
            
            // Store session ID for future requests
            this.sessionId = data.sessionId;
            this.currentSessionId.textContent = data.sessionId.slice(-8);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage({
                type: 'bot',
                content: data.response
            });
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            
            // Show more detailed error message
            let errorMessage = 'System Error: ';
            if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Cannot connect to server. Please check your internet connection.';
            } else if (error.message.includes('401')) {
                errorMessage += 'Authentication failed. Please check API configuration.';
            } else if (error.message.includes('500')) {
                errorMessage += 'Server error. Please try again later.';
            } else {
                errorMessage += `${error.message}. Please check your connection and try again.`;
            }
            
            this.addMessage({
                type: 'bot',
                content: errorMessage
            });
        } finally {
            this.isProcessing = false;
            this.sendButton.disabled = false;
        }
    }
    
    
    addMessage(messageData) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageData.type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = messageData.type === 'user' ? '◉' : '◉';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = messageData.content;
        
        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        
        this.chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Add some personality with slight delays for multiple messages
        if (messageData.type === 'bot') {
            messageElement.style.animationDelay = '0.1s';
        }
    }
    
    showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'message bot';
        typingElement.id = 'typingIndicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '◉';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'typing-indicator';
        typingContent.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        typingElement.appendChild(avatar);
        typingElement.appendChild(typingContent);
        
        this.chatMessages.appendChild(typingElement);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTo({
            top: this.chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    async loadConversations() {
        try {
            const response = await fetch('/api/sessions');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load conversations');
            }
            
            this.displayConversations(data.sessions);
            
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.conversationsList.innerHTML = `
                <div class="dropdown-item empty">
                    <span>Failed to load conversations</span>
                </div>
            `;
        }
    }
    
    displayConversations(conversations) {
        if (conversations.length === 0) {
            this.conversationsList.innerHTML = `
                <div class="dropdown-item empty">
                    <span>No conversations yet</span>
                </div>
            `;
            return;
        }
        
        // Sort conversations by most recent first
        const sortedConversations = conversations.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt);
            const dateB = new Date(b.updatedAt || b.createdAt);
            return dateB - dateA;
        });
        
        const conversationsHTML = sortedConversations.slice(0, 10).map(conversation => {
            const createdAt = new Date(conversation.createdAt);
            const timeAgo = this.getTimeAgo(createdAt);
            const preview = this.getConversationPreview(conversation);
            const isCurrentSession = conversation.sessionId === this.sessionId;
            
            return `
                <div class="dropdown-item ${isCurrentSession ? 'current' : ''}" 
                     data-session-id="${conversation.sessionId}"
                     onclick="chatbot.loadConversation('${conversation.sessionId}')">
                    <div class="conversation-info">
                        <div class="conversation-title">
                            Session ${conversation.sessionId.slice(-8)}
                            ${isCurrentSession ? ' (Current)' : ''}
                        </div>
                        <div class="conversation-preview">${preview}</div>
                        <div class="conversation-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.conversationsList.innerHTML = conversationsHTML;
    }
    
    getConversationPreview(conversation) {
        if (conversation.messageCount === 0) {
            return 'No messages yet';
        } else if (conversation.preview && conversation.preview !== 'No messages yet') {
            return conversation.preview;
        } else {
            return `${conversation.messageCount} message${conversation.messageCount !== 1 ? 's' : ''}`;
        }
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d ago`;
        }
    }
    
    loadConversation(sessionId) {
        // Close dropdown
        this.conversationsDropdown.querySelector('.dropdown-content').style.display = 'none';
        
        // Navigate to conversation view
        window.location.href = `/conversation-view.html?sessionId=${sessionId}`;
    }
    
    startNewChat() {
        // Clear current session
        this.sessionId = null;
        this.currentSessionId.textContent = 'New';
        
        // Clear messages
        this.chatMessages.innerHTML = '';
        
        // Add welcome message
        this.addWelcomeMessage();
        
        // Focus on input
        this.messageInput.focus();
    }
    
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new Chatbot();
    
    // Make chatbot globally accessible for debugging
    window.chatbot = chatbot;
});
