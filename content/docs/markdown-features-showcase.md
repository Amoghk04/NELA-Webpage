# Markdown Features Showcase

This page demonstrates all the markdown features supported in our documentation.

## GitHub-Style Callouts

### Note
> [!NOTE]
> This is a note callout. Use this for general information that doesn't fit other categories.

### Info
> [!INFO]
> This is an info callout. Use this to highlight important information.

### Warning
> [!WARNING]
> This is a warning callout. Use this to alert users about potential issues.

### Danger
> [!DANGER]
> This is a danger callout. Use this for critical information that requires immediate attention.

### Tip
> [!TIP]
> This is a tip callout. Use this to share helpful suggestions and best practices.

## Code Blocks with Copy Button

Hover over code blocks to see the copy button:

```javascript
// Example JavaScript code
function helloWorld() {
  console.log('Hello, World!');
  return true;
}

helloWorld();
```

```python
# Example Python code
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

```bash
# Example Bash commands
npm install
npm run dev
# Start the development server
```

## Mermaid Diagrams

### Flowchart
\`\`\`mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[Deploy]
    E --> F[End]
\`\`\`

### Sequence Diagram
\`\`\`mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    User->>Browser: Click search
    Browser->>Server: Send query
    Server-->>Browser: Return results
    Browser-->>User: Display results
\`\`\`

### Class Diagram
\`\`\`mermaid
classDiagram
    class Animal {
        +name: String
        +age: Number
        +eat()
        +sleep()
    }
    
    class Dog {
        +breed: String
        +bark()
    }
    
    class Cat {
        +color: String
        +meow()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat
\`\`\`

## Tables

| Feature | Support | Since |
| --- | --- | --- |
| Copy button on code | ✓ Yes | v1.0 |
| GitHub callouts | ✓ Yes | v1.0 |
| Mermaid diagrams | ✓ Yes | v1.0 |
| Syntax highlighting | ✓ Yes | v1.0 |
| Responsive tables | ✓ Yes | v1.0 |

## Text Formatting

**Bold text** - use double asterisks or underscores

*Italic text* - use single asterisks or underscores

***Bold and italic*** - use triple asterisks

~~Strikethrough text~~ - use double tildes

`Inline code` - use backticks

## Lists

### Unordered List
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

### Ordered List
1. First step
2. Second step
   1. Sub-step
   2. Another sub-step
3. Third step

## Links and Images

[Visit GitHub](https://github.com)

[Link with title](https://github.com "GitHub - Where the world builds software")

## Blockquote

> This is a blockquote. You can use it to highlight important quotes or excerpts from other sources.
>
> It can span multiple lines and include **formatting**.

## Horizontal Rule

---

## Code Highlighting

The documentation supports syntax highlighting for multiple languages:

```json
{
  "name": "example",
  "version": "1.0.0",
  "description": "An example JSON file",
  "main": "index.js"
}
```

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

const users: User[] = [];

function addUser(user: User): void {
  users.push(user);
}
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Example Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
```

## Combining Features

> [!WARNING]
> Always follow best practices when implementing features.

Here's a complete example:

```typescript
// This is a TypeScript example with copy button
interface Config {
  debug: boolean;
  maxRetries: number;
}

const config: Config = {
  debug: true,
  maxRetries: 3,
};
```

Then test with this flowchart:

\`\`\`mermaid
flowchart LR
    A[Config] --> B[Validate]
    B --> C{Valid?}
    C -->|Yes| D[Apply]
    C -->|No| E[Error]
\`\`\`

## Tips for Documentation Writers

> [!TIP]
> - Use callouts to highlight important information
> - Add diagrams to explain complex concepts
> - Keep code examples short and focused
> - Use consistent formatting throughout

## Common Patterns

> [!NOTE]
> Always include examples with your documentation.

> [!INFO]
> Cross-reference related sections for better navigation.

> [!WARNING]
> Don't use deprecated APIs in examples.

---

For more information, explore other documentation sections!
