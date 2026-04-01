<script lang="ts">
	import Accordion from '$lib/ui/Accordion.svelte';
	import FunctionalRequirements from './messenger/FunctionalRequirements.svelte';
</script>

<div class="space-y-3">
	<Accordion title="The situation 👀">
		<p>
			Mobile messengers are essential part of the daily life, allowing to easily stay in touch with family,
			friends, and colleagues. However, despite messenger apps growing popularity, only a handful of them dominate
			the market, often lacking the flexibility to meet everyone's specific needs or desired features.
		</p>
		<p class="mt-3">
			So you decide to create a Flutter messenger app with functionality and customization you've always wanted.
		</p>
	</Accordion>

	<Accordion title="Functional requirements 📌" defaultOpen={true}>
		<FunctionalRequirements />
	</Accordion>

	<Accordion title="Expected outcome 🎯">
		<p class="font-medium text-kood-text">The finished project should have the following:</p>
		<ul class="mt-2 list-disc space-y-2 pl-5">
			<li>User can create an account in the application with email, password and username.</li>
			<li>Application features a profile page.</li>
			<li>Application has an organized chat list.</li>
			<li>User can send and receive chat invites to/from other users.</li>
			<li>User is able to edit and delete their messages.</li>
			<li>Sensitive data is encrypted.</li>
		</ul>
	</Accordion>

	<Accordion title="Extra requirements 📚">
		<h4 class="font-semibold text-kood-text">Reviewer-Friendly Setup</h4>
		<p class="mt-2">
			To simplify the review and testing process, include ready-to-install .apk file so your project can be run
			without requiring a full Flutter or Android Studio setup. Also the backend should start with a single command,
			no manual installation of language runtimes, libraries, or additional dependencies should be required (e.g.
			docker or simple script).
		</p>
		<p class="mt-3">The reviewer should be able to interact with the app using the following quick methods:</p>
		<ul class="mt-2 list-disc space-y-1 pl-5">
			<li>Install directly on an Android device</li>
			<li>Use a lightweight emulator (e.g. NoxPlayer, BlueStacks)</li>
			<li>Browser-based online emulator (e.g. appetize)</li>
		</ul>
		<p class="mt-3">
			A short Reviewer Guide section must be provided in the README explaining how to use each option above to open
			and interact with the app. If the .apk file exceeds Git hosting limits (e.g., &gt;20–50 MB), it should be
			provided via external storage (e.g. Google Drive, Dropbox, or a GitHub Release).
		</p>
		<h4 class="mt-5 font-semibold text-kood-text">Audio chat</h4>
		<p class="mt-2">
			Enable users to record messages with the device microphone and send them in the chat. Users should be able
			to play received audio messages in the chat.
		</p>
		<h4 class="mt-5 font-semibold text-kood-text">Push notifications</h4>
		<p class="mt-2">
			Implement push notifications for chat messages and user invites. User should be able to mute notifications
			for any chat.
		</p>
	</Accordion>

	<Accordion title="Bonus functionality 🎁">
		<p>
			You're welcome to implement other features as you see fit. But anything you implement should not change the
			default functional behavior of your project.
		</p>
		<p class="mt-3">
			You may use any additional tools, command line arguments, or separate builds to switch your bonus
			functionality on.
		</p>
	</Accordion>

	<Accordion title="Useful links 🔗">
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<a class="text-kood-accent underline" href="https://flutter.dev/docs" target="_blank" rel="noreferrer"
					>Flutter Docs</a
				>
			</li>
			<li>
				<a class="text-kood-accent underline" href="https://dart.dev/guides" target="_blank" rel="noreferrer"
					>Dart Docs</a
				>
			</li>
			<li>
				<a class="text-kood-accent underline" href="https://flutter.dev/widgets" target="_blank" rel="noreferrer"
					>Flutter widget catalog</a
				>
			</li>
			<li>
				<a class="text-kood-accent underline" href="https://serverpod.dev" target="_blank" rel="noreferrer"
					>Backend Development With Serverpod</a
				>
			</li>
			<li>
				<a
					class="text-kood-accent underline"
					href="https://pub.dev/packages/flutter_pw_validator"
					target="_blank"
					rel="noreferrer">Password Strength Checker</a
				>
			</li>
			<li>
				<a
					class="text-kood-accent underline"
					href="https://pub.dev/packages/email_validator"
					target="_blank"
					rel="noreferrer">Flutter Email Verification</a
				> (example topic)
			</li>
			<li>
				<a
					class="text-kood-accent underline"
					href="https://pub.dev/packages/cryptography"
					target="_blank"
					rel="noreferrer">Cryptography in Flutter</a
				>
			</li>
		</ul>
	</Accordion>

	<Accordion title="What you'll learn 🧠">
		<ul class="list-disc space-y-2 pl-5">
			<li>Building messenger applications with Flutter</li>
			<li>Working with backend routes and services</li>
			<li>Persisting state and data</li>
			<li>Secure storage</li>
			<li>Real-time indicators</li>
		</ul>
	</Accordion>

	<Accordion title="Deliverables and Review Requirements 📁">
		<ul class="list-disc space-y-2 pl-5">
			<li>All source code and configuration files</li>
			<li>
				A README file with:
				<ul class="mt-2 list-disc pl-5">
					<li>Project overview</li>
					<li>Setup and installation instructions</li>
					<li>Usage guide</li>
					<li>Any additional features or bonus functionality implemented</li>
				</ul>
			</li>
			<li>
				During the review, be prepared to:
				<ul class="mt-2 list-disc pl-5">
					<li>Demonstrate the application on iOS or Android emulator/physical device</li>
					<li>Explain your code and design choices</li>
					<li>Discuss any challenges you faced and how you overcame them</li>
				</ul>
			</li>
		</ul>
	</Accordion>
</div>
