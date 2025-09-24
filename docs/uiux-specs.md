Greenfield UI/UX Specification
1. Core Input & Command System
The entire interface will be designed around a fast, keyboard-driven input experience, prioritizing efficiency and minimizing mouse clicks.

Markdown Support: All text input fields (tasks, goals, reflections) will fully support Markdown conventions. This includes:

Headings (#, ##, etc.)

Bulleted lists (* or -)

Numbered lists (1.)

Bold and italics (**bold**, *italic*)

To-do checkboxes ([ ]) that can be toggled by the cursor.

Pervasive Command Palette: A central command palette will be accessible via a universal keyboard shortcut (e.g., Cmd + K or Ctrl + K). This palette enables quick navigation and action.

/[view] commands for navigation (e.g., /week, /month, /quarter).

/3month command will display an overview of the past three months.

/month3 command will display a three-month planning view for the future.

Inspirational Placeholders: When a user opens a blank entity, the input field will be pre-populated with an inspirational quote from a thought leader, thematically related to the context or the user's goals.

2. Weekly and Daily Planning Views
Weekly Planning View: The main screen will be a canvas for weekly planning, with a minimal header and a collapsible side panel.

Layout: Divided into seven columns, one for each day.

Keystroke-driven Actions:

Typing [ ] at the start of a line will create a to-do task.

Typing / will bring up the in-line command palette.

Typing # followed by a word will suggest a project tag.

AI Integration: An agent-assisted prompt can appear, suggesting a breakdown of the weekly goal into daily tasks.

Daily Planning View: This view focuses on a single day.

Sections: Divided into a "Big 3" section for high-priority tasks and an "All Tasks" section.

Kanban Integration: Tasks can be "promoted" to the "Big 3" section with a simple keystroke shortcut or drag-and-drop.

Task Management: Each task will be a component with text, a checkbox, and visible tags.

3. Monthly View & Calendar Planning
The monthly view will serve as both a lookback and a planning tool.

View: A monthly calendar grid will be the main UI. Calendar cells will show a visual summary of tasks and goals.

Interaction:

Drill-down: Clicking on a day or week will navigate the user to the daily or weekly view.

Drag-and-Drop: Users can drag projects or tasks from the side panel onto specific weeks on the calendar.

Side Panel: A persistent, collapsible side panel on the right will show details and quick actions for any selected entity (task, project, goal). It will also be the home for monthly digests and agent interactions.

4. Recaps & Agent Interactions
Monthly Digest: The agent will generate a summary of the month's progress. The UI will present the summary as a text block with interactive elements. The user can interact with stalled tasks directly to re-add, deprioritize, or delete them.

Quarterly Recap & Reflection: The agent will guide the user through a reflective process with a series of prompts. This will include reviewing monthly digests, deep-diving into projects, and personal reflection.

Pervasive Career Coach: The career coach will be a wise mentor, invokable from any view via /commands. It will:

Provide Challenging Perspectives: Inject thought-provoking questions to encourage deeper reflection.

Leave "Little Notes": Offer small, contextually relevant notes for encouragement or gentle nudges.

Content Generation: Automatically package accomplishments into content cards (e.g., "Performance Review Draft," "Resume Bullet Points") for easy viewing, editing, and export.
