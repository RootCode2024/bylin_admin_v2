import * as z from 'zod'
import parsePhoneNumberFromString, {
  parsePhoneNumberWithError,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js";
import type { Customer } from '~/types/customer';

// ========================================
// Validation du téléphone
// ========================================
export const phoneSchema = z.object({
  countryCode: z.string().min(1, 'Le code pays est requis'),
  number: z.string().min(1, 'Le numéro est requis')
}).refine((data) => {
  try {
    const fullNumber = `${data.number}`
    return isValidPhoneNumber(fullNumber, data.countryCode as CountryCode)
  } catch {
    return false
  }
}, {
  message: 'Numéro de téléphone invalide pour ce pays',
  path: ['number']
})

export function formatPhoneNumber(countryCode: string, number: string): string {
  try {
    const phoneNumber = parsePhoneNumberWithError(
      number,
      countryCode as CountryCode
    );
    return phoneNumber?.format('E.164') || number
  } catch {
    return number
  }
}

export function parseStoredPhone(phone: string | null | undefined): { countryCode: string, number: string } | null {
  if (!phone) return null

  try {
    const phoneNumber = parsePhoneNumberWithError(phone);
    if (phoneNumber) {
      return {
        countryCode: phoneNumber.country || 'BJ',
        number: phoneNumber.nationalNumber
      }
    }
  } catch {
    // Si le parsing échoue, on retourne null
  }

  return null
}

// ========================================
// Validation de l'email avec vérification DNS
// ========================================
export const emailSchema = z
  .string()
  .min(1, 'L\'email est requis')
  .email('Format d\'email invalide')
  .refine((email) => {
    // Vérification du format plus stricte
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/
    return emailRegex.test(email)
  }, 'Format d\'email invalide')
  .refine((email) => {
    // Vérification des domaines suspects
    const suspiciousDomains = ['tempmail', 'throwaway', 'guerrillamail', '10minutemail']
    const domain = email.split('@')[1]?.toLowerCase()
    return !suspiciousDomains.some(sus => domain?.includes(sus))
  }, 'Ce domaine d\'email n\'est pas autorisé')

// ========================================
// Validation de la date de naissance
// ========================================
export const dateOfBirthSchema = z
  .string()
  .optional()
  .nullable()
  .refine((date) => {
    if (!date) return true // Optionnel

    const birthDate = new Date(date)
    const today = new Date()

    // Vérification que la date n'est pas dans le futur
    if (birthDate > today) return false

    // Calcul de l'âge
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    // L'utilisateur doit avoir au moins 13 ans
    return age >= 13
  }, 'L\'utilisateur doit avoir au moins 13 ans')
  .refine((date) => {
    if (!date) return true

    const birthDate = new Date(date)
    const maxAge = 150 // Age maximum raisonnable
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()

    return age <= maxAge
  }, 'Date de naissance non valide')

// ========================================
// Validation du genre
// ========================================
export enum Gender {
  Male = "male",
  Female = "female",
  Other = "other",
}

export const genderSchema = z
  .enum(Gender, {
    message:
      "Veuillez sélectionner une option valide : Masculin, Féminin ou Autre",
  })
  .optional();

// ========================================
// Schema complet du formulaire client
// ========================================
export const customerFormSchema = z.object({
  first_name: z
    .string()
    .min(1, 'Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),

  last_name: z
    .string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),

  email: emailSchema,

  phone: z.object({
    countryCode: z.string(),
    number: z.string()
  }).optional().nullable(),

  date_of_birth: dateOfBirthSchema,

  gender: genderSchema,

  status: z.enum(['active', 'inactive', 'suspended'])
})

export type CustomerFormSchema = z.infer<typeof customerFormSchema>

// ========================================
// Liste des pays les plus utilisés pour le sélecteur
// ========================================
export const popularCountries = [
  { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪' },
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
]

export function getCustomerCountryCode(customer: Customer): CountryCode {
  const code = customer.preferences?.countryCode;

  if (typeof code === "string" && code.length === 2) {
    return code as CountryCode;
  }

  return "BJ"; // fallback par défaut
}


export function formatPhone(
  phone?: string,
  country: string = "BJ",
  format: "INTERNATIONAL" | "NATIONAL" = "INTERNATIONAL"
) {
  if (!phone) return "—";

  try {
    const phoneNumber = parsePhoneNumberFromString(
      phone,
      country as CountryCode
    );

    if (!phoneNumber?.isValid()) return phone;

    return format === "NATIONAL"
      ? phoneNumber.formatNational()
      : phoneNumber.formatInternational();
  } catch {
    return phone;
  }
}
