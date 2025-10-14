// Avatar helpers used across the app
// - getGenderAvatar(seed, sex): deterministic gender-based avatar URL
// - getProfilePictureUrl(userLike): resolves uploaded picture or falls back to gender avatar

// Build a normalized backend base URL (no trailing slash, no trailing /api)
function getBackendBaseUrl() {
	try {
		let base = import.meta?.env?.VITE_API_URL || "http://localhost:5000";
		base = String(base).replace(/\/+$/g, "");
		if (base.endsWith("/api")) base = base.slice(0, -4);
		return base;
	} catch (_) {
		return "http://localhost:5000";
	}
}

const isAbsoluteUrl = (u) => typeof u === "string" && /^(https?:)?\/\//i.test(u);
const isDataUrl = (u) => typeof u === "string" && /^data:/i.test(u);

// Normalize a possibly relative uploads path to absolute URL
function toAbsoluteUploadsUrl(urlLike) {
	if (!urlLike) return null;
	if (isAbsoluteUrl(urlLike) || isDataUrl(urlLike)) return urlLike;

	const base = getBackendBaseUrl();
	let p = String(urlLike).trim().replace(/\\/g, "/");

	// Remove leading uploads/ if present; we'll add it back once
	p = p.replace(/^\/?uploads\/?/i, "");

	// If already has known subfolder, keep; else assume profiles/
	if (!p.startsWith("profiles/") && !p.startsWith("documents/")) {
		// If looks like just a filename, force profiles/
		if (!p.includes("/")) p = `profiles/${p}`;
	}

	return `${base}/uploads/${p}`;
}

// Map sex value to avatar service path
function mapSexToVariant(sex) {
	const s = String(sex || "").toLowerCase();
	if (s === "femme" || s === "female" || s === "woman" || s === "girl") return "girl";
	if (s === "homme" || s === "male" || s === "man" || s === "boy") return "boy";
	return "neutral";
}

export function getGenderAvatar(seed = "user", sex = "") {
	// Deterministic seed ensures consistent avatar per user
	const username = encodeURIComponent(String(seed || "user"));
	const variant = mapSexToVariant(sex);

	// Primary service: avatar.iran.liara.run
	if (variant === "girl") return `https://avatar.iran.liara.run/public/girl?username=${username}`;
	if (variant === "boy") return `https://avatar.iran.liara.run/public/boy?username=${username}`;
	return `https://avatar.iran.liara.run/public?username=${username}`;
}

export function getProfilePictureUrl(userLike) {
	if (!userLike) return null;

	// Accept different shapes: may be user, profile form data, or lightweight object
	const u = userLike || {};

	// Prefer explicit URL fields first
	const directUrl = u.profile_picture_url || u.profilePictureUrl || u.profileURL || u.url;
	if (directUrl) {
		if (isAbsoluteUrl(directUrl) || isDataUrl(directUrl)) return directUrl;
		return toAbsoluteUploadsUrl(directUrl);
	}

	// Then file/path style fields
	const fileField =
		u.profile_picture ||
		u.profilePicture ||
		u.picture ||
		u.avatar ||
		u.image;
	if (fileField) {
		if (isAbsoluteUrl(fileField) || isDataUrl(fileField)) return fileField;
		return toAbsoluteUploadsUrl(fileField);
	}

	// Nothing uploaded: fallback to gender-based deterministic avatar
	const seed =
		(u.id != null && `user${u.id}`) ||
		(u.email ? `mail:${u.email}` : null) ||
		(u.firstname || u.lastname ? `${u.firstname || ""}${u.lastname || ""}` : null) ||
		"user";
	const sex = u.sex || u.gender || u.sexe || "";
	return getGenderAvatar(seed, sex);
}

export default {
	getGenderAvatar,
	getProfilePictureUrl,
};

