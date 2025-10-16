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
      return await fetchCanvasAPI(`/api/v1/courses/${courseId}/assignments?per_page=50`);
    } catch (error) {
      console.error(`Error fetching assignments for course ${courseId}:`, error);
      return [];
    }
  }

  // assignment analysis
  function analyzeAssignment(assignment) {
    const title = assignment.title.toLowerCase();
    let difficulty = 'medium';
    let estimatedHours = 2;
    let type = 'assignment';

    // determine assignment type and difficulty from title
    // will eventually use api to determine this
    if (title.includes('quiz') || title.includes('test')) {
      type = 'quiz';
      difficulty = 'easy';
      estimatedHours = 1;
    } else if (title.includes('exam') || title.includes('midterm') || title.includes('final')) {
      type = 'exam';
      difficulty = 'hard';
      estimatedHours = 6;
    } else if (title.includes('essay') || title.includes('paper') || title.includes('report') || title.includes('presentation')) {
      type = 'essay';
      difficulty = 'hard';
      estimatedHours = 8;
    } else if (title.includes('project') || title.includes('presentation')) {
      type = 'project';
      difficulty = 'hard';
      estimatedHours = 12;
    } else if (title.includes('discussion') || title.includes('forum')) {
      type = 'discussion';
      difficulty = 'easy';
      estimatedHours = 0.5;
    } else if (title.includes('homework') || title.includes('hw')) {
      type = 'homework';
      difficulty = 'medium';
      estimatedHours = 2;
    }

    return { type, difficulty, estimatedHours };
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

      // fetch assignments for each course
      const assignmentPromises = courses.map(async (course) => {
        const assignments = await fetchCourseAssignments(course.id);
        return assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.name,
          dueDate: assignment.due_at,
          courseName: course.name,
          courseId: course.id,
          htmlUrl: assignment.html_url,
          points: assignment.points_possible
        }));
      });

      const assignmentArrays = await Promise.all(assignmentPromises);
      const allAssignments = assignmentArrays.flat();

      // filter assignments: only upcoming ones due within the next 30 days
      const now = new Date();
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setDate(now.getDate() + 30);

      const upcomingAssignments = allAssignments
        .filter(assignment => {
          if (!assignment.dueDate) return false;
          
          const dueDate = new Date(assignment.dueDate);
          
          // exclude overdue assignments
          if (dueDate < now) return false;
          
          // only include assignments due within the next 30 days
          return dueDate <= oneMonthFromNow;
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