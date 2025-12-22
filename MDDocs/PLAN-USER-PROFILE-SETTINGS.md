# Plán: User Profile & Settings

## Téma aplikácie
LaTeX Generator - matematické/logické nástroje (Karnaugh maps, AST, Proof trees)

## Navrhované User Settings

### 1. Editor Preferences
- **Font Size**: Small, Medium, Large (default: Medium)
- **Editor Theme**: Light, Dark, Auto (default: Light)
- **Word Wrap**: Enable/Disable (default: Enable)
- **Line Numbers**: Show/Hide (default: Show)
- **Minimap**: Show/Hide (default: Hide)
- **Auto-complete**: Enable/Disable (default: Enable)

### 2. LaTeX Preferences
- **Default Document Class**: article, book, report, beamer (default: article)
- **Default Packages**: Custom list of packages to include by default
- **Compilation Timeout**: 30s, 60s, 90s (default: 30s)
- **Auto-compile on Save**: Enable/Disable (default: Disable)

### 3. Export & Download
- **Default Export Format**: PDF, LaTeX source, Both (default: PDF)
- **Auto-download**: Enable/Disable (default: Disable)
- **File Naming**: Timestamp, Custom prefix (default: Timestamp)

### 4. Workspace Settings
- **Auto-save**: Enable/Disable, Interval (default: Disable)
- **Default Template**: None, Karnaugh Map, AST, Proof Tree (default: None)
- **Show Welcome Screen**: Enable/Disable (default: Enable)

### 5. Privacy & Security
- **Data Retention**: Keep all, Auto-delete after 30/60/90 days (default: Keep all)
- **Analytics**: Enable/Disable (default: Enable)
- **Share Usage Data**: Enable/Disable (default: Disable)

### 6. Notifications
- **Email Notifications**: Enable/Disable (default: Disable)
- **Compilation Success**: Enable/Disable (default: Enable)
- **Compilation Errors**: Enable/Disable (default: Enable)
- **System Updates**: Enable/Disable (default: Enable)

### 7. Appearance
- **Language**: English, Slovak (default: English)
- **Color Scheme**: Light, Dark, Auto (default: Light)
- **Compact Mode**: Enable/Disable (default: Disable)

## User Profile Design

### Layout
- **Header Section**: Avatar, Name, Email, Role badge
- **Tabs**: Profile Info | Settings | Activity/History
- **Profile Info Tab**:
  - Basic Information (Name, Email, User ID)
  - SSO Information (if applicable)
  - Account Statistics (Number of created maps/trees, Last login)
- **Settings Tab**:
  - Grouped settings with icons
  - Save/Cancel buttons
  - Reset to defaults option
- **Activity Tab** (optional):
  - Recent creations
  - Last modified items

### Design Elements
- **Color Scheme**: Blue/Purple gradient (matching app theme)
- **Icons**: React Icons (FaUser, FaCog, FaPalette, etc.)
- **Cards**: Clean white cards with subtle shadows
- **Form Elements**: Modern inputs with labels

## Backend Changes Needed

### User Model Extensions
```typescript
settings: {
  editor: {
    fontSize: string;
    theme: string;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    autoComplete: boolean;
  };
  latex: {
    defaultDocumentClass: string;
    defaultPackages: string[];
    compilationTimeout: number;
    autoCompile: boolean;
  };
  export: {
    defaultFormat: string;
    autoDownload: boolean;
    fileNaming: string;
  };
  workspace: {
    autoSave: boolean;
    autoSaveInterval: number;
    defaultTemplate: string;
    showWelcomeScreen: boolean;
  };
  privacy: {
    dataRetention: string;
    analytics: boolean;
    shareUsageData: boolean;
  };
  notifications: {
    email: boolean;
    compilationSuccess: boolean;
    compilationErrors: boolean;
    systemUpdates: boolean;
  };
  appearance: {
    language: string;
    colorScheme: string;
    compactMode: boolean;
  };
}
```

### API Endpoints
- `GET /api/user/profile` - Get user profile and settings
- `PUT /api/user/settings` - Update user settings
- `GET /api/user/stats` - Get user statistics (optional)

## Implementation Steps

1. **Update User Model** - Add settings field
2. **Create Settings Service** - Backend service for settings management
3. **Create Settings Controller** - Handle settings API requests
4. **Create Settings Routes** - Add routes to app.ts
5. **Create Settings Context** - Frontend context for settings
6. **Redesign UserProfile** - New layout with tabs
7. **Create Settings Components** - Individual setting groups
8. **Integrate Settings** - Use settings in LaTeX Editor and other components

