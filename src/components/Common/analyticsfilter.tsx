import { useState, useRef, useEffect } from "react";
import { getBranches } from "../../services/branchService";

const ReportFilters = () => {
  const [showDate, setShowDate] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [showBranch, setShowBranch] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [branchNames, setBranchNames] = useState<string[]>(["All"]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await getBranches({ status: "Active" });
        if (res.success && res.data) {
          setBranchNames(["All", ...res.data.branches.map((b) => b.name)]);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    loadBranches();
  }, []);

  // selected custom date range (include year)
  const [startDate, setStartDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [endDate, setEndDate] = useState<{ year: number; month: number; day: number } | null>(null);

  const dateRef = useRef<HTMLDivElement | null>(null);
  const customDateRef = useRef<HTMLDivElement | null>(null);
  const branchRef = useRef<HTMLDivElement | null>(null);
  const optionsRef = useRef<HTMLDivElement | null>(null);

  /* ===== Outside Click Close ===== */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dateRef.current && !dateRef.current.contains(target)) setShowDate(false);
      if (customDateRef.current && !customDateRef.current.contains(target)) setShowCustomDate(false);
      if (branchRef.current && !branchRef.current.contains(target)) setShowBranch(false);
      if (optionsRef.current && !optionsRef.current.contains(target)) setShowOptions(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // dynamic months with navigation (left = current displayed month, right = next)
  const today = new Date();
  const [leftMonthIndex, setLeftMonthIndex] = useState<number>(today.getMonth()); // 0..11
  const [leftYear, setLeftYear] = useState<number>(today.getFullYear());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // compute right month/year from left state
  const rightDate = new Date(leftYear, leftMonthIndex + 1, 1);
  const rightMonthIndex = rightDate.getMonth();
  const rightYear = rightDate.getFullYear();

  const leftMonthDays = new Date(leftYear, leftMonthIndex + 1, 0).getDate();
  const rightMonthDays = new Date(rightYear, rightMonthIndex + 1, 0).getDate();

  const changeLeftMonth = (delta: number) => {
    const newDate = new Date(leftYear, leftMonthIndex + delta, 1);
    setLeftMonthIndex(newDate.getMonth());
    setLeftYear(newDate.getFullYear());
  };

  // helpers for range logic (include year)
  const toNumber = (y: number, m: number, d: number) => y * 10000 + m * 100 + d;
  const isStart = (y: number, m: number, d: number) =>
    !!startDate && startDate.year === y && startDate.month === m && startDate.day === d;
  const isEnd = (y: number, m: number, d: number) =>
    !!endDate && endDate.year === y && endDate.month === m && endDate.day === d;
  const inRange = (y: number, m: number, d: number) => {
    if (!startDate || !endDate) return false;
    const n = toNumber(y, m, d);
    return n > toNumber(startDate.year, startDate.month, startDate.day) && n < toNumber(endDate.year, endDate.month, endDate.day);
  };

  const handleDayClick = (y: number, m: number, d: number) => {
    if (!startDate) {
      setStartDate({ year: y, month: m, day: d });
      setEndDate(null);
      return;
    }

    if (startDate && !endDate) {
      const startNum = toNumber(startDate.year, startDate.month, startDate.day);
      const clickedNum = toNumber(y, m, d);
      if (clickedNum >= startNum) {
        setEndDate({ year: y, month: m, day: d });
      } else {
        setStartDate({ year: y, month: m, day: d });
        setEndDate(null);
      }
      return;
    }

    // both exist -> start new range
    setStartDate({ year: y, month: m, day: d });
    setEndDate(null);
  };

  return (
    <div className="mb-4 flex flex-wrap justify-end gap-2 relative">
      {/* ================= Filter by Date ================= */}
      <div ref={dateRef} className="relative">
        <button
          onClick={() => {
            setShowDate(!showDate);
            setShowBranch(false);
            setShowOptions(false);
          }}
          className="h-10 px-4 border rounded-md bg-white text-sm"
        >
          Filter by Date
        </button>

        {showDate && (
          <div className="absolute top-11 left-0 z-30 bg-white border rounded-md shadow-lg w-56">
            {["Today", "Yesterday", "Last 7 days", "Last 30 days", "Last 90 days"].map((item) => (
              <div
                key={item}
                className="px-4 py-2 text-sm hover:bg-bb-hover cursor-pointer"
                onClick={() => setShowDate(false)}
              >
                {item}
              </div>
            ))}

            <div
              onClick={() => {
                setShowCustomDate(true);
                setShowDate(false);
              }}
              className="px-4 py-2 text-sm text-yellow-600 font-medium border-t hover:bg-yellow-50 cursor-pointer"
            >
              + Custom Date
            </div>
          </div>
        )}
      </div>

      {/* ================= Custom Date Calendar ================= */}
      {showCustomDate && (
        <div
          ref={customDateRef}
          className="absolute right-0 top-14 z-50 bg-white border rounded-lg shadow-2xl w-[520px]"
        >
          {/* Header - dynamic months and years with navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <button onClick={() => changeLeftMonth(-1)} className="text-lg text-gray-500">
              ‹
            </button>
            <span className="font-medium text-sm">
              {leftYear === rightYear
                ? `${monthNames[leftMonthIndex]} – ${monthNames[rightMonthIndex]} ${leftYear}`
                : `${monthNames[leftMonthIndex]} ${leftYear} – ${monthNames[rightMonthIndex]} ${rightYear}`}
            </span>
            <button onClick={() => changeLeftMonth(1)} className="text-lg text-gray-500">
              ›
            </button>
          </div>

          {/* Calendar Body */}
          <div className="flex gap-6 p-4">
            {/* ===== Left Month ===== */}
            <div className="flex-1">
              <div className="text-center font-medium mb-2">
                {monthNames[leftMonthIndex]}, {leftYear}
              </div>

              <div className="grid grid-cols-7 text-xs text-center text-gray-400 mb-1">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <div key={`w-l-${d}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 text-sm">
                {Array.from({ length: leftMonthDays }, (_, i) => {
                  const day = i + 1;
                  const y = leftYear;
                  const m = leftMonthIndex + 1; // 1..12
                  const start = isStart(y, m, day);
                  const end = isEnd(y, m, day);
                  const mid = inRange(y, m, day);
                  return (
                    <div
                      key={`left-${day}`}
                      onClick={() => handleDayClick(y, m, day)}
                      className={`h-8 flex items-center justify-center cursor-pointer
                        ${start || end ? "bg-yellow-400 font-semibold" : ""}
                        ${mid ? "bg-yellow-200" : ""}
                        hover:bg-yellow-100`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== Right Month ===== */}
            <div className="flex-1">
              <div className="text-center font-medium mb-2">
                {monthNames[rightMonthIndex]}, {rightYear}
              </div>

              <div className="grid grid-cols-7 text-xs text-center text-gray-400 mb-1">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <div key={`w-r-${d}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 text-sm">
                {Array.from({ length: rightMonthDays }, (_, i) => {
                  const day = i + 1;
                  const y = rightYear;
                  const m = rightMonthIndex + 1;
                  const start = isStart(y, m, day);
                  const end = isEnd(y, m, day);
                  const mid = inRange(y, m, day);
                  return (
                    <div
                      key={`right-${day}`}
                      onClick={() => handleDayClick(y, m, day)}
                      className={`h-8 flex items-center justify-center cursor-pointer
                        ${start || end ? "bg-yellow-400 font-semibold" : ""}
                        ${mid ? "bg-yellow-200" : ""}
                        hover:bg-yellow-100`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= Filter by Branch ================= */}
      <div ref={branchRef} className="relative">
        <button
          onClick={() => {
            setShowBranch(!showBranch);
            setShowDate(false);
            setShowOptions(false);
          }}
          className="h-10 px-4 border rounded-md bg-white text-sm"
        >
          Filter by Branch
        </button>

        {showBranch && (
          <div className="absolute top-11 left-0 z-30 bg-white border rounded-md shadow-lg w-56 p-2">
            {branchNames.map((item, index) => (
              <label
                key={item}
                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer
                  ${index === 0 ? "bg-yellow-100 font-medium" : "hover:bg-gray-100"}`}
              >
                <input type="checkbox" defaultChecked={index === 0} />
                {item}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ================= Options ================= */}
      <div ref={optionsRef} className="relative">
        <button
          onClick={() => {
            setShowOptions(!showOptions);
            setShowDate(false);
            setShowBranch(false);
          }}
          className="h-10 px-4 border rounded-md bg-white text-sm"
        >
          Options
        </button>

        {showOptions && (
          <div className="absolute top-11 right-0 z-30 bg-white border rounded-md shadow-lg w-64 p-2">
            {[
              "All",
              "Customer Id",
              "First Name",
              "Last Name",
              "Email Address",
              "Phone Number",
              "Gross Amount",
              "No. of Sales",
              "Net Amount",
              "Discount",
            ].map((item, index) => (
              <label
                key={item}
                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer
                  ${index === 0 ? "bg-yellow-100 font-medium" : "hover:bg-gray-100"}`}
              >
                <input type="checkbox" defaultChecked={index === 0} />
                {item}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ================= Clear ================= */}
      <button className="h-10 px-4 bg-yellow-400 border border-black rounded-md text-sm font-medium">
        Clear
      </button>
    </div>
  );
};

export default ReportFilters;
