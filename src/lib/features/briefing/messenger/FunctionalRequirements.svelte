<div class="space-y-3">
	<p>
		You are to create the messenger with the <a
			class="text-kood-accent underline underline-offset-2 hover:brightness-110"
			href="https://flutter.dev"
			target="_blank"
			rel="noreferrer">Flutter</a
		> framework. When finished, you should be able to demonstrate that the project works on iOS or Android. You can
		use either an emulator or a physical device to show the application functionality.
	</p>
	<p class="mt-3">
		This is a full-stack project, so you will need to implement both backend and frontend, as well as data
		persistence.
	</p>
	<p class="mt-3 font-medium text-kood-text">The application has to support the following features:</p>

	<h4 class="mt-5 font-semibold text-kood-text">Registration &amp; Authentication</h4>
	<ul class="mt-2 list-disc space-y-2 pl-5">
		<li>
			User has to submit their email, password, and username to create an account in the application. To log in,
			only the email and password are required.
		</li>
		<li>
			If the user's chosen username or email is already in use, registration should not be allowed. The user has to
			get visual feedback if they attempt to create an account with an existing email or username.
		</li>
		<li>
			Application should check the password strength. Password should contain:
			<ul class="mt-2 list-disc pl-5">
				<li>at least 8 characters</li>
				<li>at least 1 lowercase letter</li>
				<li>at least 1 uppercase letter</li>
				<li>at least 1 digit</li>
				<li>at least 1 special character</li>
			</ul>
			If the password does not pass the strength check, registration should not be allowed. User has to get
			corresponding visual feedback.
		</li>
		<li>Application should feature email verification.</li>
		<li>User must be able to reset their password via Email-based Password Recovery.</li>
		<li>
			Application should ensure that a user remains logged in even after closing and reopening the messenger,
			unless they explicitly log out or their session expires.
		</li>
	</ul>

	<h4 class="mt-5 font-semibold text-kood-text">User profile</h4>
	<ul class="mt-2 list-disc space-y-2 pl-5">
		<li>
			User has to have a profile page in the application, which at least consists of a profile picture, username,
			and About me section. You are free to add other profile sections.
		</li>
		<li>
			Upon the first log into the application, profile picture features some default image and About me section is
			empty.
		</li>
		<li>
			Application should support at least both JPEG and PNG formats for profile picture upload. Profile picture size
			limit is 5MB.
		</li>
		<li>User should be able to edit any data in the profile.</li>
	</ul>

	<h4 class="mt-5 font-semibold text-kood-text">Search</h4>
	<p class="mt-2">User must be able to search for other users by their current username or by email.</p>

	<h4 class="mt-5 font-semibold text-kood-text">Invite</h4>
	<ul class="mt-2 list-disc space-y-2 pl-5">
		<li>User should be able to send and receive chat invitations. Invitation can be accepted or declined.</li>
		<li>There is no need to use invites if the designated person is already in the user's chat list.</li>
		<li>Application should have a list of pending invitations.</li>
	</ul>

	<h4 class="mt-5 font-semibold text-kood-text">Chat list</h4>
	<ul class="mt-2 list-disc space-y-2 pl-5">
		<li>Application must have a chat list sorted by the time of the last message received or sent.</li>
		<li>Tapping on a list item navigates to the specific chat.</li>
		<li>User should be able to archive a specific chat and unarchive it at any time.</li>
	</ul>

	<h4 class="mt-5 font-semibold text-kood-text">Messaging</h4>
	<ul class="mt-2 list-disc space-y-2 pl-5">
		<li>
			Users must be able to send text messages, images and videos to each other. Size limit for image and video
			files is 20MB after compression.
		</li>
		<li>
			All messages should have visual indicators that show whether they have been sent, delivered and read by the
			recipient, with corresponding visual feedback if delivery fails.
		</li>
		<li>Users should be able to edit and delete their own messages in the chat.</li>
		<li>
			Chats need to have typing indicators - visual cues that inform a user when their chat contact is in the
			process of composing a message.
		</li>
	</ul>

	<h4 class="mt-5 font-semibold text-kood-text">Data encryption</h4>
	<p class="mt-2">
		Application should encrypt user's sensitive data before it is inserted or updated in the database. Text messages,
		media files, user profile data, and list of contacts/chats must be encrypted using strong encryption algorithms
		of your choice.
	</p>

	<h4 class="mt-5 font-semibold text-kood-text">Error handling</h4>
	<p class="mt-2">
		In case of any common errors/failures/interruptions the messenger should give visual feedback about the
		situation to the user and return to the last stable application state.
	</p>
</div>
