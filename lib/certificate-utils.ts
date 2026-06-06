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
      return "text-primary bg-accent";
    case "expired":
      return "text-yellow-600 bg-yellow-50";
    case "revoked":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

export const certificateCategories = [
  "B.Sc. Computer Science",
  "B.Sc. Cyber Security",
  "B.Sc. Software Engineering",
  "B.Sc. Information Systems",
  "B.Sc. Accounting",
  "B.Sc. Economics",
  "B.Sc. Political Science",
  "B.Sc. Criminology and Security Studies",
  "B.Sc. Peace Studies and Conflict Resolution",
  "B.A. Military History",
];

export const degreeClasses = [
  "First Class Honours",
  "Second Class Honours (Upper Division)",
  "Second Class Honours (Lower Division)",
  "Third Class Honours",
  "Pass",
];

export function canonicalCertificatePayload(fields: {
  companyName: string;
  matriculationNumber: string;
  dateOfBirth: string;
  category: string;
  classOfDegree: string;
  dateOfAward: string;
  certificateNumber: string;
  viceChancellor: string;
}) {
  return [
    fields.companyName.trim().toUpperCase(),
    fields.matriculationNumber.trim().toUpperCase(),
    fields.dateOfBirth,
    fields.category.trim().toUpperCase(),
    fields.classOfDegree.trim().toUpperCase(),
    fields.dateOfAward,
    fields.certificateNumber.trim().toUpperCase(),
    fields.viceChancellor.trim().toUpperCase(),
  ].join("|");
}

export function canonicalHolderPayload(fullName: string, dateOfBirth: string) {
  return `${fullName.trim().toUpperCase()}|${dateOfBirth}`;
}
