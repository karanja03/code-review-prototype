export interface AcademyContentItem {
	title: string;
	description: string;
	keyPoints: Array<{ title: string; description: string }>;
	commonPatterns: string[];
	reviewerTips: string[];
}

export const ACADEMY_CONTENT: Record<string, AcademyContentItem> = {
	security: {
		title: 'Security Review Guide',
		description:
			'The system should resist abuse, protect sensitive data, enforce access control, and avoid trusting the wrong inputs. Your role is to catch vulnerabilities before they reach production.',
		keyPoints: [
			{
				title: 'Input Sanitization',
				description:
					'Never trust external input. Validate, escape, and sanitize all data coming from users, APIs, or external sources before using it in queries, commands, or rendering.'
			},
			{
				title: 'Authentication & Verification',
				description:
					'Verify that users are who they claim to be with proper mechanisms (passwords, tokens, MFA). Never rely on client-side flags or cookies alone for security decisions.'
			},
			{
				title: 'Authorization & Access Control',
				description:
					'Check permissions at every step. Watch for access-by-ID gaps (users guessing another user\'s ID), missing permission checks, and role-based boundaries.'
			},
			{
				title: 'Secrets & Sensitive Data',
				description:
					'No hardcoded API keys, passwords, or secrets in code or logs. Store credentials in environment variables. Avoid logging sensitive data like passwords, tokens, or personal info.'
			},
			{
				title: 'Dependency Security',
				description:
					'Third-party libraries should be maintained and up-to-date. Watch for known vulnerabilities in dependencies and unnecessary packages that expand your attack surface.'
			},
			{
				title: 'SQL Injection & Injection Attacks',
				description:
					'Use parameterized queries or ORM tools that handle escaping. Never concatenate user input into SQL strings, commands, or system calls.'
			},
			{
				title: 'Cross-Site Scripting (XSS)',
				description:
					'Sanitize and escape user-provided HTML/JS before rendering. Use templating engines that auto-escape by default. Never use `dangerouslySetInnerHTML` without careful review.'
			},
			{
				title: 'CORS & Cross-Origin Requests',
				description:
					'Configure CORS carefully. Avoid `*` origin unless intended. Validate that API endpoints check origin and authentication headers.'
			}
		],
		commonPatterns: [
			'User input directly used in SQL queries or shell commands',
			'Missing permission checks before returning sensitive data',
			'Hardcoded secrets or API keys in code',
			'Client-side authentication checks without server validation',
			'Unvalidated redirects or file paths based on user input',
			'Sensitive data logged to console or error messages',
			'Missing HTTPS or certificate validation for external APIs',
			'Weak or missing authentication for admin endpoints'
		],
		reviewerTips: [
			'Ask "Can a user with ID 5 access another user with ID 6\'s data?" — access-by-ID bugs are common.',
			'Look for password fields, API keys, or tokens in logs, error messages, or code comments.',
			'Check if external input is validated before being used in queries, redirects, or rendering.',
			'Trace the flow: where does user input come from, how is it processed, and where does it go?',
			'Don\'t assume the frontend validates; always check server-side validation.',
			'Test with edge cases: empty strings, null, very long inputs, special characters, and malicious payloads.'
		]
	},

	correctness: {
		title: 'Correctness Review Guide',
		description:
			'Does the code do what it\'s supposed to? Check requirements, edge cases, validation, data integrity, and plain logic. Correctness is the foundation of everything else.',
		keyPoints: [
			{
				title: 'Requirement Implementation',
				description:
					'Does the code match the task description? Required features should exist, nothing core should be missing, and behavior should match expectations.'
			},
			{
				title: 'Edge Case Handling',
				description:
					'Unusual inputs (empty, zero, large, null, boundaries) should not break important flows. Test the happy path and the sad path.'
			},
			{
				title: 'Input Validation',
				description:
					'External inputs should be checked for type, range, format, and required fields. Null/undefined should be handled explicitly, not silently.'
			},
			{
				title: 'Data Integrity',
				description:
					'Updates and transactions keep related data consistent. No partial updates, orphaned records, or inconsistent states when operations fail midway.'
			},
			{
				title: 'Logical Correctness',
				description:
					'Conditions, operators, algorithms, and loops match intended behavior. Off-by-one errors, wrong comparisons (< vs <=), and inverted logic hide here.'
			},
			{
				title: 'Error Handling',
				description:
					'Failures are caught and handled gracefully. Exceptions don\'t crash the app; errors are logged and users get meaningful feedback.'
			},
			{
				title: 'Return Values & Side Effects',
				description:
					'Functions return the expected type and value. Side effects (mutations, API calls) happen when and where intended, not as accidental byproducts.'
			}
		],
		commonPatterns: [
			'Off-by-one errors in loops or array access (starting at 0 vs 1)',
			'Missing null/undefined checks leading to crashes',
			'Wrong comparison operators (< instead of <=, == instead of ===)',
			'Partial updates without transactions (one succeeds, one fails)',
			'Missing required fields not validated before use',
			'Infinite loops or missing break/return statements',
			'Logic inverted (if !isValid instead of if isValid)',
			'Race conditions in async code (callbacks firing in wrong order)',
			'Features mentioned in the task but not implemented'
		],
		reviewerTips: [
			'Read the requirements first. Then ask: "Is this implemented? Could anything be missing?"',
			'Trace the happy path (valid input, success case) and the sad path (null, empty, wrong type).',
			'Check boundary conditions: 0, 1, -1, empty arrays, very large numbers.',
			'Look for null checks and what happens if they fail. Does the app crash or handle it gracefully?',
			'Test the logic yourself mentally or on paper before reviewing. "If X is true, then Y should happen."',
			'Watch for off-by-one errors in loops and array slicing. Index 0? Length - 1?',
			'Check if all code paths return a value or handle errors. No silent failures.'
		]
	},

	performance: {
		title: 'Performance Review Guide',
		description:
			'Is the solution efficient for real-world load? Watch for slow algorithms, database N+1 queries, memory bloat, and wasted I/O. Performance matters for users.',
		keyPoints: [
			{
				title: 'Algorithm Complexity',
				description:
					'How does work grow with input size? Avoid nested loops where a single pass, map, or set lookup would do. O(n²) can destroy performance on large datasets.'
			},
			{
				title: 'Database Query Efficiency',
				description:
					'Watch for N+1 patterns (one query per item in a loop), over-fetching (getting all columns when you need one), and many tiny queries that should be batched.'
			},
			{
				title: 'Memory Efficiency',
				description:
					'Don\'t load massive datasets into memory. Use pagination, streaming, filtering, or lazy-loading instead. Remember: 1M records in an array eats RAM quickly.'
			},
			{
				title: 'I/O & Network Efficiency',
				description:
					'Batch API calls, file reads, and network requests. Don\'t repeat identical work in tight loops. Reuse connections and cache where appropriate.'
			},
			{
				title: 'Caching Usage',
				description:
					'Don\'t recompute or refetch the same expensive result repeatedly. Small cache, memoization, or simple reuse saves huge amounts of work.'
			},
			{
				title: 'DOM Performance',
				description:
					'Minimize reflows and repaints. Batch DOM changes, use virtual scrolling for large lists, and avoid layout thrashing (reading and writing DOM in rapid succession).'
			},
			{
				title: 'String & Collection Operations',
				description:
					'String concatenation in loops? Use arrays and join(). Searching through arrays repeatedly? Use Sets or Maps for O(1) lookup.'
			}
		],
		commonPatterns: [
			'N+1 queries: fetching a list, then looping to fetch details for each item',
			'Nested loops on large datasets (O(n²) or worse)',
			'Fetching entire tables when filtering would be better',
			'String concatenation in loops instead of arrays + join()',
			'Loading massive datasets into memory instead of paginating',
			'Repeated database queries in a loop that could be batched',
			'Missing indexes on frequently queried columns',
			'Inefficient sorting or searching on unindexed data',
			'Re-rendering entire components when only one item changed'
		],
		reviewerTips: [
			'Ask: "How does this scale to 1M records?" If the answer is "slowly," it\'s a problem.',
			'Look for loops. What happens inside? If it\'s a database query, you have an N+1 bug.',
			'Check for repeated work: same calculation, same API call, same database query in a loop.',
			'Memory: Are you loading a list of 100k items into memory? Could pagination or lazy-loading help?',
			'Database: Is every record fetched in full, or only the columns you need? Indexes on WHERE clauses?',
			'Compare to alternatives: "Could a Set/Map be faster than an array search? Could a batch query replace 100 individual ones?"',
			'Don\'t assume small datasets. Real-world data grows. O(n²) is fine for 100 items, terrible for 100k.'
		]
	},

	structure_architecture: {
		title: 'Structure & Architecture Review Guide',
		description:
			'Is the codebase organized for understanding, scalability, and maintainability? Good structure makes it easy for newcomers to navigate and for the system to grow without chaos.',
		keyPoints: [
			{
				title: 'Separation of Concerns',
				description:
					'Business logic, UI, data access, and infrastructure should be separate. Don\'t mix API calls in the UI component or database queries in business logic classes.'
			},
			{
				title: 'Module Organization',
				description:
					'Folders and files group related concerns. The layout should be predictable: a new team member should be able to guess where to find something.'
			},
			{
				title: 'Dependency Management',
				description:
					'Coupling, import fan-in, and circular dependencies should stay controlled. A utility shouldn\'t import from a feature that imports from that utility.'
			},
			{
				title: 'Layer Boundaries',
				description:
					'Logic stays in the layer it belongs. Don\'t leak database details, HTTP status codes, or transport concerns into business logic or UI components.'
			},
			{
				title: 'Code Cohesion',
				description:
					'Each module or class keeps closely related responsibilities together. A "UserManager" should manage users, not also handle email sending and payments.'
			},
			{
				title: 'Reusability & DRY',
				description:
					'Don\'t repeat the same logic in multiple places. Extract common patterns into shared utilities or base classes. Reduce duplication.'
			},
			{
				title: 'Testability',
				description:
					'Code should be easy to test in isolation. Heavy coupling to frameworks or external services makes testing hard. Dependency injection and clear interfaces help.'
			},
			{
				title: 'Naming & Clarity',
				description:
					'Files, functions, and variables should clearly describe what they do. A file named "utils.ts" is too vague; "dateFormatter.ts" is clear.'
			}
		],
		commonPatterns: [
			'API calls and network logic mixed into UI components',
			'Database queries in business logic instead of a data access layer',
			'Huge "utils.ts" files with unrelated helper functions',
			'Circular dependencies (A imports B, B imports A)',
			'Deep nesting of folders that hides the actual structure',
			'Components or modules that do too many things (God classes)',
			'No clear separation between UI, business logic, and data access',
			'Hardcoded values scattered throughout instead of in config/constants',
			'Duplicate logic in multiple files that should be extracted'
		],
		reviewerTips: [
			'Ask: "If I\'m new to this codebase, can I guess where to find this feature?" If not, structure needs work.',
			'Look at imports. Do they go in the right direction? Should utils import from features, or features import from utils?',
			'Check module size. Is a file doing one thing well, or is it a grab-bag of unrelated logic?',
			'Trace a feature end-to-end. Does it follow a clear layer pattern (routes → handlers → business logic → data access)?',
			'Watch for circular dependencies. Use a tool like `madge` to visualize import graphs.',
			'Look for duplication. If you see the same pattern in three files, it should probably be extracted into one shared place.',
			'Consider testability: Could you test this logic without mocking the entire framework or database?',
			'Is the folder structure self-explanatory? Could a new developer understand the project layout in 5 minutes?'
		]
	}
};
