import { useState } from 'react'

function App() {
  // ההגדרות של "אבני הלגו" של השפה שלנו
  const subjects = [
    { text: "אף אחד", stress: 3 },
    { text: "המנהל שלי", stress: 2 },
    { text: "דני מהצוות", stress: 1 }
  ];

  const times = [
    { text: "אף פעם לא", stress: 3 },
    { text: "בדרך כלל לא", stress: 2 },
    { text: "היום לא", stress: 1 }
  ];

  const actions = [
    { text: "מעריך אותי בכלל", stress: 3 },
    { text: "רואה את ההשקעה שלי", stress: 2 },
    { text: "אמר לי תודה על הפיצ'ר", stress: 1 }
  ];

  // המצב הנוכחי של המשפט
  const [subject, setSubject] = useState(subjects[0]);
  const [time, setTime] = useState(times[0]);
  const [action, setAction] = useState(actions[0]);

  // חישוב הטמפרטורה הרגשית (מקסימום 9)
  const totalStress = subject.stress + time.stress + action.stress;
  
  // קביעת צבע הרקע לפי רמת הלחץ (אלכימיה!)
  const getBackgroundColor = () => {
    if (totalStress >= 8) return '#ffebee'; // אדום לחוץ - עיוות מוחלט (Beta State)
    if (totalStress >= 5) return '#fff3e0'; // כתום אזהרה
    return '#e8f5e9'; // ירוק רגוע - עובדות יבשות (Alpha State)
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', backgroundColor: getBackgroundColor(), minHeight: '100vh', transition: 'background-color 0.5s ease', textAlign: 'center' }}>
      <h1>⚗️ מעבדת אלכימיה של שפה</h1>
      <p style={{ fontSize: '18px', color: '#555' }}>
        שחק עם הכמתים ושים לב איך הגוף שלך מגיב כשהמשפט הופך מ"אשליה" (תטא/בטא) לעובדתי ורגוע (אלפא).
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '40px 0', fontSize: '24px' }}>
        <select value={subject.text} onChange={(e) => setSubject(subjects.find(s => s.text === e.target.value))} style={{ fontSize: '20px', padding: '10px', borderRadius: '8px' }}>
          {subjects.map((s, idx) => <option key={idx} value={s.text}>{s.text}</option>)}
        </select>

        <select value={time.text} onChange={(e) => setTime(times.find(t => t.text === e.target.value))} style={{ fontSize: '20px', padding: '10px', borderRadius: '8px' }}>
          {times.map((t, idx) => <option key={idx} value={t.text}>{t.text}</option>)}
        </select>

        <select value={action.text} onChange={(e) => setAction(actions.find(a => a.text === e.target.value))} style={{ fontSize: '20px', padding: '10px', borderRadius: '8px' }}>
          {actions.map((a, idx) => <option key={idx} value={a.text}>{a.text}</option>)}
        </select>
      </div>

      <div style={{ marginTop: '50px', padding: '30px', backgroundColor: 'white', borderRadius: '15px', display: 'inline-block', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
        <h2>מד מערכת העצבים (Felt Sense): {totalStress}/9</h2>
        <div style={{ height: '20px', width: '300px', backgroundColor: '#eee', borderRadius: '10px', overflow: 'hidden', margin: '0 auto' }}>
          <div style={{ 
            height: '100%', 
            width: `${(totalStress / 9) * 100}%`, 
            backgroundColor: totalStress >= 8 ? '#f44336' : totalStress >= 5 ? '#ff9800' : '#4caf50',
            transition: 'width 0.5s ease, background-color 0.5s ease'
          }}></div>
        </div>
        <p style={{ marginTop: '20px', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
          {totalStress >= 8 ? '⚠️ אזהרה: משוואת הגנה קיצונית (כיווץ - Beta State)' : totalStress >= 5 ? '🟡 שים לב: יש כאן עיוות של המציאות' : '✅ מצוין: המוח שלך קורא עכשיו עובדות (התרחבות - Alpha State)'}
        </p>
      </div>
    </div>
  )
}

export default App