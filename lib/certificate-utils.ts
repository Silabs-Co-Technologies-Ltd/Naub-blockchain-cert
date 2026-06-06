export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000);
  return `NAUB-${year}-${timestamp}${random}`;
}

export function isCertificateExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getCertificateStatusColor(status: string): string {
  switch (status) {
    case "valid":
      return "text-green-600 bg-green-50";
    case "expired":
      return "text-yellow-600 bg-yellow-50";
    case "revoked":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

export const certificateCategories = [
  "Computer Science",
  "Cyber Security",
  "Software Engineering",
  "Information Systems",
  "Accounting",
  "Economics",
  "Political Science",
  "Criminology and Security Studies",
  "Peace Studies and Conflict Resolution",
  "Military History",
];
