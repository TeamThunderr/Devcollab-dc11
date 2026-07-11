import React, { useState } from "react";
import { Replace, ArrowUp, ArrowDown, X, CaseSensitive, WholeWord } from "lucide-react";

interface EditorFindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onReplaceContent: (newContent: string) => void;
}

export function EditorFindReplace({
  isOpen,
  onClose,
  content,
  onReplaceContent,
}: EditorFindReplaceProps) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isWholeWord, setIsWholeWord] = useState(false);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [showReplace, setShowReplace] = useState(false);

  if (!isOpen) return null;

  const getMatches = () => {
    if (!findText) return [];
    let regexStr = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) regexStr = `\\b${regexStr}\\b`;
    const regex = new RegExp(regexStr, isCaseSensitive ? "g" : "gi");
    const matches: number[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push(match.index);
    }
    return matches;
  };

  const matches = getMatches();
  const matchCount = matches.length;

  const handleNext = () => {
    if (matchCount === 0) return;
    setCurrentMatchIdx((prev) => (prev + 1) % matchCount);
  };

  const handlePrev = () => {
    if (matchCount === 0) return;
    setCurrentMatchIdx((prev) => (prev - 1 + matchCount) % matchCount);
  };

  const handleReplace = () => {
    if (matchCount === 0 || !findText) return;
    let regexStr = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) regexStr = `\\b${regexStr}\\b`;
    const regex = new RegExp(regexStr, isCaseSensitive ? "" : "i");
    const newContent = content.replace(regex, replaceText);
    onReplaceContent(newContent);
  };

  const handleReplaceAll = () => {
    if (matchCount === 0 || !findText) return;
    let regexStr = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) regexStr = `\\b${regexStr}\\b`;
    const regex = new RegExp(regexStr, isCaseSensitive ? "g" : "gi");
    const newContent = content.replace(regex, replaceText);
    onReplaceContent(newContent);
  };

  return (
    <div className="absolute top-2 right-6 z-40 bg-[#252526] border border-[#454545] rounded shadow-xl p-2 flex flex-col gap-2 w-80 text-xs text-[#cccccc] animate-in slide-in-from-top-2 duration-150 select-none">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="p-1 hover:bg-[#333] rounded text-[#858585] hover:text-[#ccc]"
          title="Toggle Replace"
        >
          <Replace className={`w-3.5 h-3.5 ${showReplace ? "text-blue-400" : ""}`} />
        </button>
        <div className="flex-1 flex items-center bg-[#3c3c3d] border border-[#3c3c3d] focus-within:border-[#007acc] rounded px-2 py-1">
          <input
            type="text"
            value={findText}
            onChange={(e) => {
              setFindText(e.target.value);
              setCurrentMatchIdx(0);
            }}
            placeholder="Find"
            className="w-full bg-transparent border-none text-xs text-white focus:outline-none font-mono"
            autoFocus
          />
          <button
            onClick={() => setIsCaseSensitive(!isCaseSensitive)}
            className={`p-0.5 rounded ml-1 ${isCaseSensitive ? "bg-white/20 text-white" : "text-[#858585] hover:text-[#ccc]"}`}
            title="Match Case"
          >
            <CaseSensitive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsWholeWord(!isWholeWord)}
            className={`p-0.5 rounded ml-1 ${isWholeWord ? "bg-white/20 text-white" : "text-[#858585] hover:text-[#ccc]"}`}
            title="Match Whole Word"
          >
            <WholeWord className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-[10px] text-[#858585] w-12 text-center truncate">
          {matchCount > 0 ? `${currentMatchIdx + 1}/${matchCount}` : "No results"}
        </span>
        <button onClick={handlePrev} className="p-1 hover:bg-[#333] rounded text-[#858585] hover:text-[#ccc]" title="Previous Match">
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleNext} className="p-1 hover:bg-[#333] rounded text-[#858585] hover:text-[#ccc]" title="Next Match">
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button onClick={onClose} className="p-1 hover:bg-[#333] rounded text-[#858585] hover:text-[#ccc]" title="Close (Esc)">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {showReplace && (
        <div className="flex items-center gap-1 pl-6">
          <div className="flex-1 flex items-center bg-[#3c3c3d] border border-[#3c3c3d] focus-within:border-[#007acc] rounded px-2 py-1">
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace"
              className="w-full bg-transparent border-none text-xs text-white focus:outline-none font-mono"
            />
          </div>
          <button
            onClick={handleReplace}
            disabled={matchCount === 0}
            className="px-2 py-1 bg-[#333] hover:bg-[#444] disabled:opacity-40 rounded text-[11px]"
            title="Replace"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={matchCount === 0}
            className="px-2 py-1 bg-[#333] hover:bg-[#444] disabled:opacity-40 rounded text-[11px]"
            title="Replace All"
          >
            All
          </button>
        </div>
      )}
    </div>
  );
}
