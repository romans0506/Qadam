export interface ValidationError {
    field: string
    message: string
}

export function validateProfile(data:{
  full_name?: string
  nickname?: string
  bio?: string
  grade?: number
  gpa?: number
  ent_score?: number
  sat_score?: number
  act_score?: number
  ielts_score?: number
  toefl_score?: number
}): ValidationError[]{
    const errors: ValidationError[] = []

    if (data.full_name !== undefined) {
    if (data.full_name.length < 2) {
      errors.push({ field: 'full_name', message: 'Имя должно быть минимум 2 символа' })
    }
    if (data.full_name.length > 60) {
      errors.push({ field: 'full_name', message: 'Имя не должно превышать 60 символов' })
    }
    if (!/^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(data.full_name)) {
      errors.push({ field: 'full_name', message: 'Имя должно содержать только буквы' })
    }
  }

  // Никнейм
  if (data.nickname !== undefined && data.nickname !== '') {
    if (data.nickname.length < 2) {
      errors.push({ field: 'nickname', message: 'Никнейм минимум 2 символа' })
    }
    if (data.nickname.length > 30) {
      errors.push({ field: 'nickname', message: 'Никнейм не более 30 символов' })
    }
    if (!/^[a-z0-9_]+$/.test(data.nickname)) {
      errors.push({ field: 'nickname', message: 'Только строчные буквы, цифры и _' })
    }
  }

  // О себе
  if (data.bio !== undefined && data.bio.length > 500) {
    errors.push({ field: 'bio', message: 'Максимум 500 символов' })
  }

  // Класс
  if (data.grade !== undefined && ![8, 9, 10, 11].includes(data.grade)) {
    errors.push({ field: 'grade', message: 'Класс должен быть 8, 9, 10 или 11' })
  }

  // GPA
  if (data.gpa !== undefined && data.gpa !== null) {
    if (data.gpa < 1.0 || data.gpa > 5.0) {
      errors.push({ field: 'gpa', message: 'GPA должен быть от 1.0 до 5.0' })
    }
  }

  // ЕНТ
  if (data.ent_score !== undefined && data.ent_score !== null) {
    if (data.ent_score < 0 || data.ent_score > 140) {
      errors.push({ field: 'ent_score', message: 'ЕНТ должен быть от 0 до 140' })
    }
  }

  // SAT
  if (data.sat_score !== undefined && data.sat_score !== null) {
    if (data.sat_score < 400 || data.sat_score > 1600) {
      errors.push({ field: 'sat_score', message: 'SAT должен быть от 400 до 1600' })
    }
  }

  // ACT
  if (data.act_score !== undefined && data.act_score !== null) {
    if (data.act_score < 1 || data.act_score > 36) {
      errors.push({ field: 'act_score', message: 'ACT должен быть от 1 до 36' })
    }
  }

  // IELTS
  if (data.ielts_score !== undefined && data.ielts_score !== null) {
    if (data.ielts_score < 0 || data.ielts_score > 9.0) {
      errors.push({ field: 'ielts_score', message: 'IELTS должен быть от 0 до 9.0' })
    }
  }

  // TOEFL
  if (data.toefl_score !== undefined && data.toefl_score !== null) {
    if (data.toefl_score < 0 || data.toefl_score > 120) {
      errors.push({ field: 'toefl_score', message: 'TOEFL должен быть от 0 до 120' })
    }
  }

  return errors
}

