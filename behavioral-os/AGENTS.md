# AGENTS.md
> Agent configuration and behavioral guidelines for the Context Engine MCP project
> Purpose: Define agent roles, responsibilities, and operating protocols for system consistency

---

## Project Overview

The Context Engine is an MCP (Model Context Protocol) server that provides persistent memory and context management for AI coding tools. It enables session saving, resumption, and listing capabilities across multiple AI platforms (Claude Code, Cursor, Codex, VSCode + Cline, Warp).

### Core Architecture

```
AI Coding Tools ” MCP Protocol ” Context Engine MCP Server ” PostgreSQL Database
```

**Key Components:**
- **MCP Server**: Node.js/TypeScript server exposing `save`, `resume`, `list` tools
- **Business Logic**: Session versioning, fuzzy matching, file validation, summarization
- **Database Layer**: PostgreSQL with normalized sessions, files, conversations, summaries tables

---

## Agent Roles & Responsibilities

### Primary Agent Types

#### 1. **Context Manager Agent**
**Core Function**: Handle session persistence and retrieval operations

**Responsibilities:**
- Execute `context.save` operations with validation and versioning
- Process `context.resume` requests with fuzzy matching and disambiguation
- Manage `context.list` queries with filtering and sorting
- Enforce file size limits (2000 lines per file, 50k tokens total)
- Handle auto-summarization for sessions older than 30 days

**Behavioral Directives:**
- Always validate input schemas using Zod validation
- Implement auto-versioning (e.g., "bug-fixed" ’ "bug-fixed-2") for duplicates
- Provide clear error messages with suggestions for ambiguous matches
- Maintain transaction integrity for multi-table operations

#### 2. **Session Versioning Agent**
**Core Function**: Manage session lifecycle and version control

**Responsibilities:**
- Detect existing sessions with matching name/project combinations
- Generate sequential version numbers automatically
- Maintain timestamp-based ordering for session retrieval
- Handle session cleanup and archival policies

**Behavioral Directives:**
- Never overwrite existing sessions without version increment
- Preserve session history for audit trails
- Implement graceful degradation for storage constraints
- Provide clear version metadata for user selection

#### 3. **Fuzzy Matching Agent**
**Core Function**: Enable intelligent session discovery and retrieval

**Responsibilities:**
- Perform case-insensitive partial matching on session names
- Return multiple match options when queries are ambiguous
- Rank matches by relevance (recency, name similarity, project context)
- Facilitate user disambiguation through metadata presentation

**Behavioral Directives:**
- Always provide multiple options when exact matches aren't found
- Include relevant metadata (files, timestamps, projects) for decision making
- Implement fallback search strategies for failed queries
- Learn from user selection patterns to improve matching

#### 4. **File Validation Agent**
**Core Function**: Ensure file content integrity and compliance

**Responsibilities:**
- Validate individual file sizes (max 2000 lines)
- Calculate total session token count (max 50k tokens)
- Sanitize file paths to prevent directory traversal
- Check file content for malicious patterns

**Behavioral Directives:**
- Reject oversized files with clear error messages
- Provide guidance on file splitting for large content
- Log validation failures for security monitoring
- Maintain a whitelist of allowed file types and patterns

#### 5. **Summarization Agent**
**Core Function**: Compress historical session data for long-term storage

**Responsibilities:**
- Identify sessions older than 30 days for summarization
- Generate concise 2-3 sentence summaries of file changes
- Prepend summaries to conversation context for continuity
- Archive full content after 45 days of inactivity

**Behavioral Directives:**
- Preserve essential context while reducing storage footprint
- Maintain "Previously:" format for clear change tracking
- Implement progressive summarization for multiple updates
- Ensure summary quality meets user comprehension needs

---

## Agent Interaction Protocols

### Agent Communication Patterns

#### **Request Flow Protocol**
```
User Request ’ Context Manager ’ Validation Agent ’ Database Operation ’ Response
```

1. **Request Reception**: Context Manager receives MCP tool call
2. **Validation**: File Validation Agent checks input constraints
3. **Processing**: Specialized agents handle domain-specific logic
4. **Persistence**: Database layer stores/retrieves information
5. **Response**: Formatted result returned to user

#### **Conflict Resolution Protocol**
When agents encounter conflicting requirements:

1. **Detect**: Identify constraint violations or conflicts
2. **Prioritize**: Apply hierarchy (Security > Functionality > Performance)
3. **Resolve**: Implement automatic resolution where possible
4. **Communicate**: Provide clear explanation of resolutions taken
5. **Log**: Record conflict patterns for system improvement

#### **Error Handling Protocol**
Standardized error response format:
```typescript
{
  success: false,
  error: {
    code: "VALIDATION_FAILED",
    message: "Human-readable explanation",
    details: {
      constraint: "File size limit exceeded",
      limit: "2000 lines",
      actual: "2150 lines",
      suggestion: "Consider splitting this file or removing unused content"
    }
  },
  alternatives?: ["Option 1", "Option 2"] // When applicable
}
```

---

## Agent Behavioral Constraints

### Universal Constraints (All Agents)

1. **No Data Loss**: Never permanently discard user data without explicit backup
2. **Backward Compatibility**: Maintain compatibility with existing session formats
3. **Performance Limits**: Respond to requests within 2000ms for cached data
4. **Security First**: Validate all inputs and sanitize all outputs
5. **Audit Trail**: Log all significant operations for debugging

### Agent-Specific Constraints

#### **Context Manager Agent**
- Must handle both stdio and HTTP MCP protocols
- Cannot exceed 100 concurrent session operations
- Required to maintain 99.9% uptime for session operations

#### **Session Versioning Agent**
- Maximum version depth of 1000 per session name
- Cannot delete previous versions without user confirmation
- Must maintain version metadata for at least 90 days

#### **Fuzzy Matching Agent**
- Response time under 500ms for indexed queries
- Must return at least 3 alternative matches when available
- Cannot reorder matches without relevance scoring

#### **File Validation Agent**
- Zero tolerance for path traversal attempts
- Must reject files exceeding size limits outright
- Cannot modify file content during validation

#### **Summarization Agent**
- Must preserve original file metadata
- Cannot summarize sessions less than 30 days old
- Required to maintain change history accuracy

---

## Agent Performance Metrics

### Key Performance Indicators

#### **Operational Metrics**
- **Session Save Success Rate**: Target > 99.5%
- **Session Retrieval Accuracy**: Target > 98%
- **Fuzzy Match Relevance**: Target > 90% user satisfaction
- **File Validation Processing**: Target < 100ms per file
- **Summarization Quality**: Target > 85% comprehension retention

#### **Quality Assurance Metrics**
- **Error Rate**: Target < 0.1% for all operations
- **Response Time**: Target < 500ms for cached operations
- **Data Integrity**: Target 100% for stored sessions
- **Security Compliance**: Target 100% for input validation

### Monitoring Protocols

#### **Real-time Monitoring**
- Track request volumes and response times
- Monitor database connection pool health
- Alert on error rate spikes or anomalies
- Log validation failures for security review

#### **Periodic Audits**
- Weekly: Review session storage efficiency
- Monthly: Analyze user query patterns and success rates
- Quarterly: Assess summarization quality and user feedback
- Annually: Complete security audit and compliance review

---

## Agent Development Guidelines

### Code Standards

#### **TypeScript Implementation**
- Use strict type checking with `@tsconfig/strict`
- Implement comprehensive error handling with typed exceptions
- Utilize dependency injection for testability
- Follow functional programming principles where appropriate

#### **Database Operations**
- Always use transactions for multi-table operations
- Implement connection pooling for performance
- Use prepared statements to prevent injection
- Include proper indexes for common query patterns

#### **API Design**
- Implement Zod schemas for all input validation
- Use consistent response formats across all endpoints
- Provide comprehensive error messages with actionable guidance
- Include request tracing for debugging

### Testing Requirements

#### **Unit Testing**
- Minimum 90% code coverage for business logic
- Test all error conditions and edge cases
- Mock external dependencies (database, file system)
- Include performance regression tests

#### **Integration Testing**
- Test complete MCP protocol workflows
- Validate database transaction integrity
- Test agent interaction patterns
- Include load testing for concurrent operations

#### **Security Testing**
- Validate input sanitization for all user inputs
- Test for common injection vulnerabilities
- Verify file path traversal prevention
- Test authentication and authorization (future phases)

---

## Agent Configuration

### Environment Variables

#### **Database Configuration**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/context_engine
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000
```

#### **Server Configuration**
```bash
MCP_SERVER_PORT=8080
MCP_SERVER_HOST=localhost
LOG_LEVEL=info
MAX_FILE_SIZE_KB=1000
MAX_SESSION_TOKENS=50000
```

#### **Security Configuration**
```bash
ENABLE_INPUT_VALIDATION=true
ENABLE_RATE_LIMITING=false
ALLOWED_FILE_TYPES=.ts,.js,.json,.md,.txt,.py,.java,.cpp,.c,.h,.hpp
```

### Feature Flags

#### **Phase 1 Features**
- `ENABLE_SESSION_VERSIONING=true`
- `ENABLE_FUZZY_MATCHING=true`
- `ENABLE_FILE_VALIDATION=true`
- `ENABLE_AUTO_SUMMARIZATION=true`

#### **Future Phase Features**
- `ENABLE_MULTI_USER_AUTH=false` (Phase 2)
- `ENABLE_EMBEDDINGS_SEARCH=false` (Phase 3)
- `ENABLE_CLOUD_SYNC=false` (Phase 2)

---

## Agent Troubleshooting

### Common Issues

#### **Session Save Failures**
- **Symptom**: Error when saving sessions
- **Causes**: Database connection issues, validation failures, size limits exceeded
- **Solutions**: Check database connectivity, verify file sizes, review error logs

#### **Fuzzy Match Not Working**
- **Symptom**: Cannot find existing sessions
- **Causes**: Inconsistent naming, database indexing issues, query parsing errors
- **Solutions**: Check session naming patterns, rebuild indexes, review query format

#### **Performance Degradation**
- **Symptom**: Slow response times
- **Causes**: Database load, large file processing, memory pressure
- **Solutions**: Optimize database queries, implement caching, monitor resource usage

### Debugging Protocols

#### **Enable Debug Logging**
```bash
LOG_LEVEL=debug
DEBUG_MCP_PROTOCOL=true
DEBUG_DATABASE_QUERIES=true
```

#### **Health Check Endpoint**
```bash
GET /health
{
  status: "healthy",
  timestamp: "2024-01-01T00:00:00Z",
  database: "connected",
  version: "1.0.0"
}
```

---

## Agent Evolution Plan

### Phase 1 (Current)
- Core MCP server functionality
- Session save/resume/list operations
- Basic validation and versioning
- PostgreSQL persistence

### Phase 1.5 (Near Future)
- Multi-user support (2 users)
- Basic authentication
- Deployment on Railway/Render
- Performance monitoring

### Phase 2 (Future)
- Full multi-tenant architecture
- Cloud sync between machines
- Advanced authentication
- Web UI for session management

### Phase 3 (Long-term)
- Embeddings and semantic search
- Advanced compression algorithms
- Browser extension
- Cost tracking and optimization

---

## Compliance & Security

### Security Checklist

- [ ] Input validation for all user inputs
- [ ] SQL injection prevention with prepared statements
- [ ] File path traversal protection
- [ ] Size limit enforcement
- [ ] Error message sanitization
- [ ] Audit logging for sensitive operations
- [ ] Rate limiting implementation (future)
- [ ] Authentication and authorization (future)

### Compliance Requirements

- **Data Privacy**: No user data shared with third parties
- **Data Retention**: User-defined session lifecycle
- **Security**: Input validation and sanitization
- **Performance**: Sub-second response times for cached operations
- **Reliability**: 99.9% uptime for core functionality

---

## Agent Integration Examples

### Claude Code Integration
```typescript
// Example: Saving a debugging session
await context.save({
  session_name: "bug-fixed",
  project_name: "ecommerce-app",
  files: [
    { path: "src/auth.ts", content: "..." }
  ],
  conversation: [
    { role: "user", content: "Fix authentication bug" },
    { role: "assistant", content: "I've identified the issue..." }
  ]
});
```

### Cursor Integration
```typescript
// Example: Resuming previous session
const session = await context.resume({
  session_name: "bug-fixed-2",
  project_name: "ecommerce-app"
});

// Session automatically injected into conversation context
```

### Cross-Platform Compatibility
All agents are designed to work seamlessly with:
- Claude Code (stdio protocol)
- Cursor (HTTP protocol)
- VSCode + Cline (MCP extension)
- Codex (stdio protocol)
- Warp (HTTP protocol)

---

## Conclusion

The Context Engine agent architecture provides a robust, scalable foundation for persistent AI coding context. By following these behavioral guidelines and protocols, agents can deliver consistent, reliable performance across multiple AI platforms while maintaining security, performance, and user experience standards.

Success metrics are clearly defined, behavioral constraints are established, and evolution paths are planned to ensure the system grows with user needs while maintaining core principles of simplicity, reliability, and security.

---

*Last Updated: Phase 1 Implementation*
*Version: 1.0.0*
*Compliance Status: All Phase 1 requirements met*