// Demo notification templates for development and testing
export const createDemoNotifications = () => [
  {
    type: 'collaboration',
    title: 'Welcome to ScholarMate!',
    message: 'You can now receive notifications for collaboration activities, mentions, and important updates.',
    priority: 'normal'
  },
  {
    type: 'mention',
    title: 'You were mentioned',
    message: 'John Doe mentioned you in a comment: "Could you review this section?"',
    priority: 'high'
  },
  {
    type: 'highlight',
    title: 'New highlight added',
    message: 'Sarah added a new highlight with code "Theory" in the methodology section.',
    priority: 'normal'
  },
  {
    type: 'comment',
    title: 'New comment on your highlight',
    message: 'Mike commented on your highlight: "Great insight! This aligns with our hypothesis."',
    priority: 'normal'
  },
  {
    type: 'system',
    title: 'Document saved',
    message: 'Your document has been automatically saved with the latest changes.',
    priority: 'low'
  }
];

// Generate random demo notification
export const getRandomDemoNotification = () => {
  const demos = createDemoNotifications();
  return demos[Math.floor(Math.random() * demos.length)];
};

// Notification type icons mapping
export const getNotificationTypeIcon = (type) => {
  const iconMap = {
    highlight: '🎨',
    comment: '💬',
    mention: '@',
    system: '⚙️',
    collaboration: '👥',
    document: '📄',
    user: '👤',
    default: '📢'
  };
  
  return iconMap[type] || iconMap.default;
};
