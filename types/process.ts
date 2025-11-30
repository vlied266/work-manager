"use client";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function Home() {
  
  const sendTestTask = async () => {
    try {
      console.log("در حال ارسال داده...");
      
      await addDoc(collection(db, "test_tasks"), {
        title: "اولین تست من در ورک منیجر",
        createdAt: new Date(),
        type: "BASIC_DIGITAL",
        status: "PENDING"
      });

      alert("✅ عالی! داده با موفقیت در فایربیس ذخیره شد.");
    } catch (error) {
      console.error("خطا در ارسال:", error);
      alert("❌ خطا: لطفاً کنسول (Inspect Element) را چک کنید.");
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <h1 className="text-4xl font-bold text-blue-400">پنل مدیریت کارها</h1>
      <p className="text-gray-400">تست اتصال به دیتابیس</p>
      
      <button
        onClick={sendTestTask}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/30"
      >
        ارسال تست به فایربیس 🚀
      </button>
    </div>
  );
}