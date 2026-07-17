// FILE: src/lib/permissions.ts
// Quy tắc quyền dùng chung cho toàn admin portal.
// Nguyên tắc: NỘI DUNG của trung tâm chỉ ADMIN sửa; GV xem + xem đáp án để dạy.
// Đây chỉ là lớp GIAO DIỆN — chặn thật nằm ở backend (authorize).

export const canEditContent = (role?: string) => role === "ADMIN";
export const canViewAnswers = (role?: string) => role === "ADMIN" || role === "TEACHER";
// GV vẫn được làm việc dạy: nhật ký, chấm bài
export const canTeach = (role?: string) => role === "ADMIN" || role === "TEACHER";