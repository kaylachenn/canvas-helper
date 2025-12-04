// Check if script is already loaded to prevent double injection
if (typeof window.canvasHelperLoaded === 'undefined') {
  window.canvasHelperLoaded = true;

  // Canvas API helper functions
  async function fetchCanvasAPI(endpoint) {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Canvas API fetch error:', error);
      throw error;
    }
  }

  async function fetchUserCourses() {
    try {
      return await fetchCanvasAPI('/api/v1/users/self/favorites/courses');
    } catch (error) {
      console.warn('Favorites endpoint failed, trying all courses');
      return await fetchCanvasAPI('/api/v1/courses?enrollment_state=active&per_page=50');
    }
  }

  async function fetchCourseAssignments(courseId) {
    try {
      return await fetchCanvasAPI(`/api/v1/courses/${courseId}/assignments?include[]=submission&per_page=50`);
    } catch (error) {
      console.error(`Error fetching assignments for course ${courseId}:`, error);
      return [];
    }
  }


  // AI-powered assignment analysis with Gemini
  async function analyzeAssignmentWithAI(assignment, apiKey) {
    try {
      const prompt = `Analyze this college assignment and provide a recommendation for how many days before the due date a student should start working on it.

    Assignment Title: ${assignment.title}
    Course: ${assignment.courseName}
    Points: ${assignment.points || 'N/A'}

    Consider the following factors:
    - Assignment type (quiz, exam, essay, project, discussion, homework)
    - Typical difficulty and time requirements
    - Points value indicating importance

    Respond with ONLY a single number representing the recommended number of days to start before the due date. For example: "5" means start 5 days before due date.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API ${response.status} error:`, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log(`Gemini response for "${assignment.title}":`, aiResponse);
      
      // Extract number from response
      const daysMatch = aiResponse.match(/(\d+)/);
      if (daysMatch) {
        const recommendedDays = parseInt(daysMatch[1]);
        // Validate reasonable range (1-14 days)
        return Math.min(Math.max(recommendedDays, 1), 14);
      }
      
      return null;
    } catch (error) {
      console.error('AI analysis error:', error);
      return null;
    }
  }

  //  analyze assignments with AI
  async function analyzeAssignmentsWithAI(assignments, defaultBufferDays) {
    // get the API key from storage
    const apiKey = await new Promise((resolve) => {
      if (chrome?.storage?.sync) {
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
          if (result.geminiApiKey) {
            console.log('Gemini API Key retrieved from storage. Length:', result.geminiApiKey.length);
          } else {
            console.warn('Gemini API Key not found in storage.');
          }
          resolve(result.geminiApiKey || null);
        });
      } else {
        console.warn('chrome.storage.sync is not available');
        resolve(null);
      }
    });

    if (!apiKey) {
      console.warn('No Gemini API key found, using default buffer days');
      return assignments;
    }

    const analyzed = [];
    
    for (const assignment of assignments) {
      console.log(`Analyzing assignment: "${assignment.title}"`);
      const aiRecommendedDays = await analyzeAssignmentWithAI(assignment, apiKey);
      
      if (aiRecommendedDays !== null) {
        console.log(`AI recommends ${aiRecommendedDays} days for "${assignment.title}"`);
      } else {
        console.log(`AI analysis failed, using default ${defaultBufferDays} days for "${assignment.title}"`);
      }
      
      // use the AI recommendation if available, otherwise use the default buffer
      const daysBeforeDue = aiRecommendedDays !== null ? aiRecommendedDays : defaultBufferDays;
      
      // calculate suggested start date
      let suggestedStartDate = assignment.suggestedStartDate;
      if (assignment.dueDate) {
        const dueDate = new Date(assignment.dueDate);
        const startDate = new Date(dueDate);
        startDate.setDate(startDate.getDate() - daysBeforeDue);
        suggestedStartDate = startDate.toISOString();
      }
      
      analyzed.push({
        ...assignment,
        suggestedStartDate,
        aiAnalyzed: aiRecommendedDays !== null,
        recommendedBufferDays: daysBeforeDue
      });
      
      // a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return analyzed;
  }

  async function fetchAllAssignments() {
    try {
      console.log('Starting to fetch Canvas assignments...');
      
      // get user's courses
      const courses = await fetchUserCourses();
      console.log('Fetched courses:', courses.length);

      if (!courses || courses.length === 0) {
        throw new Error('No courses found');
      }

      // Get user preferences
      const preferences = await new Promise((resolve) => {
        if (chrome?.storage?.sync) {
          chrome.storage.sync.get(['bufferDays', 'enableAI'], (result) => {
            resolve({
              bufferDays: result.bufferDays !== undefined ? result.bufferDays : 3,
              enableAI: result.enableAI || false
            });
          });
        } else {
          // Fallback defaults
          resolve({
            bufferDays: 3,
            enableAI: false
          });
        }
      });

      // fetch assignments for each course
      const assignmentPromises = courses.map(async (course) => {
        const assignments = await fetchCourseAssignments(course.id);
        return assignments
          .filter(assignment => {
            // filter out completed assignments
            const submission = assignment.submission;
            if (!submission) return true; // No submission data means not completed
            
            // check if assignment is submitted and graded, or marked as complete
            const isSubmitted = submission.submitted_at !== null;
            const isGraded = submission.grade !== null;
            const workflowState = submission.workflow_state;
            
            // exclude if submitted, unless it's unsubmitted or pending
            return !isSubmitted || workflowState === 'unsubmitted';
          })
          .map(assignment => {
            // Calculate suggested start date based on user's buffer preference
            let suggestedStartDate = null;
            if (assignment.due_at) {
              const dueDate = new Date(assignment.due_at);
              const startDate = new Date(dueDate);
              startDate.setDate(startDate.getDate() - preferences.bufferDays);
              suggestedStartDate = startDate.toISOString();
            }

            return {
              id: assignment.id,
              title: assignment.name,
              dueDate: assignment.due_at,
              courseName: course.name,
              courseId: course.id,
              htmlUrl: assignment.html_url,
              points: assignment.points_possible,
              suggestedStartDate: suggestedStartDate
            };
          });
      });

      const assignmentArrays = await Promise.all(assignmentPromises);
      let allAssignments = assignmentArrays.flat();

      // filter assignments: only upcoming ones due within the next 30 days
      const now = new Date();
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setDate(now.getDate() + 30);

      let upcomingAssignments = allAssignments
        .filter(assignment => {
          if (!assignment.dueDate) return false;
          
          const dueDate = new Date(assignment.dueDate);
          
          // exclude overdue assignments
          if (dueDate < now) return false;
          
          // only include assignments due within the next 30 days
          return dueDate <= oneMonthFromNow;
        });

      // If AI is enabled, analyze only the filtered upcoming assignments
      if (preferences.enableAI) {
        console.log('AI analysis enabled - analyzing assignments with Gemini...');
        upcomingAssignments = await analyzeAssignmentsWithAI(upcomingAssignments, preferences.bufferDays);
      }

      upcomingAssignments = upcomingAssignments
        .map(assignment => {
          // Calculate urgency based on days until due and buffer days
          const dueDate = new Date(assignment.dueDate);
          const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
          const bufferDays = preferences.bufferDays;
          
          let urgency = 'low';
          if (daysUntilDue <= bufferDays) {
            urgency = 'critical'; // Due within or past buffer period
          } else if (daysUntilDue <= bufferDays + 2) {
            urgency = 'high'; // Due shortly after buffer period
          } else if (daysUntilDue <= bufferDays + 5) {
            urgency = 'medium'; // Due within a week of buffer period
          }
          
          return { ...assignment, urgency };
        })
        .sort((a, b) => {
          // sort by urgency first, then by due date
          const urgencyOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
          const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          
          if (urgencyDiff !== 0) return urgencyDiff;
          
          // If same urgency, sort by due date
          return new Date(a.dueDate) - new Date(b.dueDate);
        });

      console.log('Fetched upcoming assignments (next 30 days):', upcomingAssignments.length);
      return upcomingAssignments;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  // listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchAssignments') {
      fetchAllAssignments()
        .then(assignments => {
          sendResponse({ success: true, assignments });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true; // Will respond asynchronously
    }
  });

  console.log('Canvas Helper content script loaded successfully');
}