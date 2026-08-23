# إعداد صلاحية الطالب في Firestore

بعد إنشاء المستخدم في Firebase Authentication، افتح **Firestore Database → Data** ثم أنشئ مجموعة باسم `studentAccess`.

يكون **Document ID** هو Firebase UID الخاص بالطالب، وليس اسم المستخدم. على الهاتف، أدخل المعرّف أولًا ثم أضف الحقول واحدًا بعد الآخر بزر **Add field** قبل الضغط على الحفظ النهائي.

| Field | Type | Example |
| --- | --- | --- |
| `username` | string | `ameen` |
| `active` | boolean | `true` |
| `maxDevices` | number (`int64` في الهاتف) | `1` |
| `allowedGrades` | array | `["grade6"]` |
| `devices` | map | `{}` |

على الهاتف، أدخل `Document ID` أولًا، ثم أضف الحقول واحدًا بعد الآخر بزر **Add field** قبل الضغط على الحفظ النهائي. اختر نوع **array** للحقل `allowedGrades`، ثم أضف عنصرًا داخله من نوع **string** بالقيمة `grade4` أو `grade5` أو `grade6` بحسب الصف المسموح.

تتحكم الحقول السابقة في الصفوف التي تعرضها البوابة وعدد المتصفحات المسجلة. يمسح المعلم محتوى `devices` فقط للسماح بجهاز جديد عند الضرورة.
