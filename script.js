const API_KEY = 'AIzaSyCp105GP2zhucOHIV8lIDJZq6AKF-EZ16w';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const chatHistory = document.getElementById('chat-history');
const searchChat = document.getElementById('search-chat');
const archiveBtn = document.getElementById('archive-btn');
const deleteBtn = document.getElementById('delete-btn');
const shareBtn = document.getElementById('share-btn');
const userDropdown = document.querySelector('.user-dropdown');
const dropdownContent = document.querySelector('.dropdown-content');

// Chat history array
let chats = JSON.parse(localStorage.getItem('gemini-chats')) || [];
let currentChatId = null;
let isEditing = false;
let currentEditId = null;

// Initialize the app
function init() {
    // Load chats from localStorage and ensure it's an array
    chats = JSON.parse(localStorage.getItem('gemini-chats')) || [];
    renderChatHistory();
    loadCurrentChat();
    
    if (!currentChatId && chats.length === 0) {
        createNewChat();
    }
    
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Send message on button click or Enter key
    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserInput();
        }
    });
    
    // Sidebar toggle
    menuBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    
    // New chat button
    newChatBtn.addEventListener('click', createNewChat);
    
    // Search chat history
    searchChat.addEventListener('input', filterChatHistory);
    
    // Header buttons
    archiveBtn.addEventListener('click', archiveCurrentChat);
    deleteBtn.addEventListener('click', deleteCurrentChat);
    shareBtn.addEventListener('click', shareCurrentChat);
    
    // User dropdown
    userDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownContent.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userDropdown.contains(e.target)) {
            dropdownContent.classList.remove('show');
        }
    });
    
    // Dropdown menu items
    document.getElementById('my-account').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/account'; // Replace with actual account page URL
    });
    
    document.getElementById('settings').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/settings'; // Replace with actual settings page URL
    });
    
    document.getElementById('logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('gemini-chats');
        window.location.href = '/login'; // Replace with actual login page URL
    });
}

// Toggle sidebar visibility
function toggleSidebar() {
    sidebar.classList.toggle('open');
}

// Create a new chat
function createNewChat() {
    const newChat = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        archived: false
    };
    
    chats.unshift(newChat);
    currentChatId = newChat.id;
    saveChats();
    renderChatHistory();
    clearChatMessages();
    
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
    
    userInput.focus();
}

// Filter chat history based on search input
function filterChatHistory() {
    const searchTerm = searchChat.value.toLowerCase();
    const historyItems = chatHistory.querySelectorAll('.chat-history-item');
    
    historyItems.forEach(item => {
        const title = item.querySelector('span').textContent.toLowerCase();
        item.style.display = title.includes(searchTerm) ? 'flex' : 'none';
    });
}

// Render chat history in sidebar
function renderChatHistory() {
    chatHistory.innerHTML = '';
    
    chats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    chats.forEach(chat => {
        if (chat.archived) return;
        
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-history-item';
        if (chat.id === currentChatId) {
            chatItem.classList.add('active');
        }
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = chat.title;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'history-delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        
        chatItem.appendChild(titleSpan);
        chatItem.appendChild(deleteBtn);
        chatItem.addEventListener('click', () => loadChat(chat.id));
        chatHistory.appendChild(chatItem);
    });
}

// Delete a chat
function deleteChat(chatId) {
    if (confirm('Are you sure you want to delete this chat?')) {
        chats = chats.filter(chat => chat.id !== chatId);
        
        if (currentChatId === chatId) {
            if (chats.length > 0) {
                currentChatId = chats[0].id;
                loadChat(currentChatId);
            } else {
                currentChatId = null;
                clearChatMessages();
                createNewChat();
            }
        }
        
        saveChats();
        renderChatHistory();
        showToast('Chat deleted');
    }
}

// Load a specific chat
function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        clearChatMessages();
        chat.messages.forEach((msg, index) => {
            addMessage(msg.content, msg.role === 'user', msg.id || index.toString());
        });
        
        renderChatHistory();
        
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    }
}

// Load the current chat from localStorage
function loadCurrentChat() {
    if (chats.length > 0) {
        if (!currentChatId) {
            currentChatId = chats[0].id;
        }
        loadChat(currentChatId);
    }
}

// Clear all messages from the chat display
function clearChatMessages() {
    chatMessages.innerHTML = '';
}

// Save chats to localStorage with error handling
function saveChats() {
    try {
        localStorage.setItem('gemini-chats', JSON.stringify(chats));
    } catch (error) {
        console.error('Failed to save chats to localStorage:', error);
        showToast('Error saving chat history');
    }
}

// Share current chat
function shareCurrentChat() {
    if (currentChatId) {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            const shareText = chat.messages.map(m => `${m.role === 'user' ? 'You' : 'Bot'}: ${m.content}`).join('\n\n');
            const shareData = {
                title: 'My Chat Conversation',
                text: shareText,
                url: `${window.location.origin}/chat/${currentChatId}`
            };

            if (navigator.share) {
                navigator.share(shareData).catch(err => {
                    console.error('Error sharing:', err);
                    copyToClipboard(shareData.url);
                });
            } else {
                copyToClipboard(shareData.url);
            }
        } else {
            showToast('No chat selected to share');
        }
    } else {
        showToast('No chat selected to share');
    }
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Chat link copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy link');
    });
}

// Archive current chat
function archiveCurrentChat() {
    if (currentChatId) {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.archived = true;
            saveChats();
            showToast('Chat archived');
            createNewChat();
        }
    }
}

// Delete current chat
function deleteCurrentChat() {
    if (currentChatId) {
        deleteChat(currentChatId);
    }
}

// Add a message to the chat display
function addMessage(message, isUser, messageId) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
    messageElement.dataset.id = messageId || Date.now().toString();

    const profileImage = document.createElement('img');
    profileImage.classList.add('profile-image');
    profileImage.src = isUser ? 'user.jpeg' : 'bot.jpg';
    profileImage.alt = isUser ? 'User' : 'Bot';

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = message;

    const messageActions = document.createElement('div');
    messageActions.className = 'message-actions';
    
    if (isUser) {
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editMessage(messageElement, messageContent);
        });
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = 'Copy';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(messageContent.textContent);
            showToast('Message copied to clipboard');
        });
        
        messageActions.appendChild(editBtn);
        messageActions.appendChild(copyBtn);
    } else {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = 'Copy';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(messageContent.textContent);
            showToast('Message copied to clipboard');
        });
        
        messageActions.appendChild(copyBtn);
    }

    messageElement.appendChild(profileImage);
    messageElement.appendChild(messageContent);
    messageElement.appendChild(messageActions);
    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (currentChatId && !isEditing) {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages.push({
                id: messageElement.dataset.id,
                role: isUser ? 'user' : 'assistant',
                content: message
            });
            
            if (isUser && chat.messages.length === 1) {
                chat.title = message.length > 30 ? message.substring(0, 30) + '...' : message;
                renderChatHistory();
            }
            
            saveChats();
        }
    }
}

// Edit a message
function editMessage(messageElement, messageContent) {
    if (isEditing) return;
    
    isEditing = true;
    currentEditId = messageElement.dataset.id;
    
    const originalText = messageContent.textContent;
    const inputField = document.createElement('textarea');
    inputField.className = 'edit-input';
    inputField.value = originalText;
    
    messageContent.replaceWith(inputField);
    inputField.focus();
    
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEditedMessage(messageElement, inputField);
            handleUserInput(inputField.value.trim());
        } else if (e.key === 'Escape') {
            cancelEdit(messageElement, originalText);
        }
    });
    
    inputField.addEventListener('blur', () => {
        saveEditedMessage(messageElement, inputField);
    });
}

// Save edited message
function saveEditedMessage(messageElement, inputField) {
    const newText = inputField.value.trim();
    if (newText) {
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = newText;
        inputField.replaceWith(messageContent);
        
        if (currentChatId) {
            const chat = chats.find(c => c.id === currentChatId);
            if (chat) {
                const messageIndex = chat.messages.findIndex(m => m.id === currentEditId);
                if (messageIndex !== -1) {
                    chat.messages[messageIndex].content = newText;
                    saveChats();
                }
            }
        }
    } else {
        cancelEdit(messageElement, inputField.value);
    }
    
    isEditing = false;
    currentEditId = null;
}

// Cancel edit
function cancelEdit(messageElement, originalText) {
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = originalText;
    
    const inputField = messageElement.querySelector('.edit-input');
    inputField.replaceWith(messageContent);
    
    isEditing = false;
    currentEditId = null;
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2000);
    }, 10);
}

// Show loading indicator
function showLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div>';
    chatMessages.appendChild(loadingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingIndicator;
}

// Hide loading indicator
function hideLoadingIndicator(indicator) {
    if (indicator) {
        indicator.remove();
    }
}

// Clean markdown from response
function cleanMarkdown(text) {
    return text
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*\*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// Handle user input
async function handleUserInput(editedMessage = null) {
    const userMessage = editedMessage !== null ? editedMessage : userInput.value.trim();
    
    if (userMessage) {
        if (editedMessage === null) {
            addMessage(userMessage, true);
            userInput.value = '';
        }
        
        sendButton.disabled = true;
        userInput.disabled = true;
        
        const loadingIndicator = showLoadingIndicator();
        
        try {
            const botMessage = await generateResponse(userMessage);
            addMessage(cleanMarkdown(botMessage), false);
        } catch (error) {
            console.error('Error generating response:', error.message, error.stack);
            let errorMessage = 'Sorry, I encountered an error. Please try again.';
            if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'CORS error. Please try again from a different device or network.';
            } else if (error.message.includes('API key')) {
                errorMessage = 'API key issue. Please contact support.';
            }
            addMessage(errorMessage, false);
        } finally {
            hideLoadingIndicator(loadingIndicator);
            sendButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }
}

// Generate response from Gemini API
async function generateResponse(prompt) {
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            }),
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000) // 10 seconds timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid API response format');
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Persist chats before page unload
window.addEventListener('beforeunload', () => {
    saveChats();
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
 