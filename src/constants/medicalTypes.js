export const MEDICAL_TYPES = {
  Vaccination: {
    icon: "needle",
    color: "#8964B5",
    background: "#F0E7F8",
  },

  "Check-up": {
    icon: "stethoscope",
    color: "#438BC4",
    background: "#E5F1FC",
  },

  Treatment: {
    icon: "medical-bag",
    color: "#D98B45",
    background: "#FFF0E1",
  },

  Surgery: {
    icon: "scissors-cutting",
    color: "#D46D85",
    background: "#FCE8EE",
  },

  Medication: {
    icon: "pill",
    color: "#4E9874",
    background: "#E3F3EA",
  },

  Other: {
    icon: "file-document-outline",
    color: "#85818D",
    background: "#EFEDF2",
  },
};

export function getMedicalType(type) {
  return MEDICAL_TYPES[type] || MEDICAL_TYPES.Other;
}
