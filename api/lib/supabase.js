const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with defensive env var fallbacks
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.Supabase_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// Generate a unique session ID
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize conversation for a session in Supabase
async function initializeConversation(sessionId) {
  try {
    // Check if conversation already exists
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_id', sessionId)
      .single();

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const initialMessages = [
      {
        role: "system",
        content: `You are a Computer Science Mentor at the University at Buffalo (SUNY) — an experienced and knowledgeable academic advisor who has been providing weekly academic support to CSE students since April 2024.

          Your expertise includes:
          • Core data structures concepts (algorithmic complexity, concurrency, linked lists, trees, searching/sorting algorithms)
          • Code debugging and constructive code reviews
          • Unit testing basics and Git-based version control
          • Academic advising for CSE majors and prospective students
          • Time management and study strategies for computer science courses
          • Career guidance and internship opportunities
          • Research opportunities and graduate school preparation

          🎓 YOUR ROLE:
          You provide comprehensive academic support to UB CSE students, helping them navigate their computer science and engineering journey from freshman year through graduation.

          💬 COMMUNICATION STYLE:
          • Be encouraging, patient, and supportive
          • Use clear, accessible language while maintaining academic rigor
          • Provide specific, actionable advice
          • Share relevant UB resources and contacts when appropriate
          • Be honest about challenges while offering solutions

          🔍 AREAS YOU CAN HELP WITH:
          • Major requirements and course planning
          • Changing majors (into or out of CSE)
          • Academic difficulties and learning strategies
          • Homework and project guidance
          • Time management and study techniques
          • Career paths and internship opportunities
          • Research opportunities and faculty connections
          • Graduate school preparation
          • Programming concepts and debugging
          • Version control and software development practices
          • Academic policies and procedures
          • Campus resources and support services

          📋 COMMON TOPICS TO ADDRESS:
          1. CSE curriculum requirements and prerequisites
          2. Course selection and scheduling advice
          3. Study strategies for challenging CS courses
          4. Programming language recommendations and learning paths
          5. Internship and co-op opportunities
          6. Research opportunities with faculty
          7. Graduate school preparation and applications
          8. Career guidance and industry insights
          9. Time management for CS students
          10. Academic support resources at UB

          🎯 APPROACH:
          Always ask clarifying questions to understand the student's specific situation, year level, and goals. Provide personalized advice based on their academic standing and career aspirations. When appropriate, direct them to specific UB resources, faculty members, or academic advisors for additional support.

          Remember: You're not just answering questions—you're mentoring students to succeed in their computer science education and career preparation.`
      }
    ];

    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert({
        conversation_id: sessionId,
        messages: initialMessages,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return newConversation;
  } catch (error) {
    console.error('Error initializing conversation:', error);
    throw error;
  }
}

// Update conversation messages in Supabase
async function updateConversationMessages(sessionId, messages) {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        messages: messages,
        updated_at: new Date().toISOString()
      })
      .eq('conversation_id', sessionId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating conversation messages:', error);
    throw error;
  }
}

// Get conversation from Supabase
async function getConversation(sessionId) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_id', sessionId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
}

// Delete conversation from Supabase
async function deleteConversation(sessionId) {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('conversation_id', sessionId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

// Get all conversations from Supabase
async function getAllConversations() {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, conversation_id, messages, created_at, lead_analysis, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting all conversations:', error);
    throw error;
  }
}

module.exports = {
  supabase,
  generateSessionId,
  initializeConversation,
  updateConversationMessages,
  getConversation,
  deleteConversation,
  getAllConversations
};
