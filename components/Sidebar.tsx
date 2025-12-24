
import React, { useState, useRef, useEffect } from 'react';
import { LoggedRequest, SidebarTab, CollectionItem, HttpRequest, TabItem } from '../types';
import { formatUrl, formatTime, getMethodColor, generateCurl, generateCurlFromRequest } from '../utils';
import { Logo } from './Logo';
import { APP_CONFIG } from '../config';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  history: LoggedRequest[];
  onImportLoggedRequest: (req: LoggedRequest) => void;
  collections: CollectionItem[];
  rootRequests: HttpRequest[];
  tabs: TabItem[];
  activeRequestId?: string;
  onSelectRequest: (req: HttpRequest) => void;
  onCreateCollection: () => void;
  onCreateRequest: () => void;
  onImportCurl: () => void;
  onClearHistory: () => void;
  onDeleteLog: (id: string) => void;
  onRenameCollection: (id: string, newName: string) => void;
  onRenameRequest: (reqId: string, newName: string) => void;
  onDeleteCollection: (id: string) => void;
  onDeleteRequest: (req: HttpRequest) => void;
  onDuplicateRequest: (reqId: string) => void;
  onToggleCollapse: (colId: string) => void;
  onMoveRequest: (reqId: string, targetColId: string | null) => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
  onCollapseSidebar: () => void;
  onResetAllData: () => void;
}

const copyToClipboard = (text: string): boolean => {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) { return false; }
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, onTabChange, history, onImportLoggedRequest, collections, rootRequests, tabs, activeRequestId, onSelectRequest, onCreateCollection, onCreateRequest, onImportCurl, onClearHistory, onDeleteLog, onRenameCollection, onRenameRequest, onDeleteCollection, onDeleteRequest, onDuplicateRequest, onToggleCollapse, onMoveRequest, isRecording, onToggleRecording, onCollapseSidebar, onResetAllData
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'collection' | 'request' | 'log', id: string, data?: any } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'collection' | 'request' | null>(null);
  const [editName, setEditName] = useState('');
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [isDragOverRootZone, setIsDragOverRootZone] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          setContextMenu(null);
          if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
              setIsSettingsOpen(false);
          }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => { 
      e.dataTransfer.setData('text/plain', id); 
      e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, id: string | null) => { 
      e.preventDefault(); 
      if (id === null) setIsDragOverRootZone(true); 
      else setDragOverColId(id); 
  };
  
  const handleDragLeave = () => {
      setDragOverColId(null);
      setIsDragOverRootZone(false);
  };

  const handleDrop = (e: React.DragEvent, id: string | null) => { 
      e.preventDefault(); 
      const reqId = e.dataTransfer.getData('text/plain'); 
      if (reqId) onMoveRequest(reqId, id); 
      handleDragLeave();
  };

  const submitRename = () => {
      if (editingId && editName.trim()) {
          if (editingType === 'collection') onRenameCollection(editingId, editName);
          else onRenameRequest(editingId, editName);
      }
      setEditingId(null);
      setEditingType(null);
  };

  const filteredHistory = history.filter(item => {
    if (!filterText) return true;
    const lower = filterText.toLowerCase();
    return item.url.toLowerCase().includes(lower) || item.method.toLowerCase().includes(lower);
  });

  const renderRequestItem = (req: HttpRequest) => {
    const isActive = activeRequestId === req.id;
    return (
      <div 
        key={req.id} 
        draggable 
        onDragStart={(e) => handleDragStart(e, req.id)} 
        onMouseDown={() => {}} // dummy to allow click
        onClick={(e) => { e.stopPropagation(); onSelectRequest(req); }} 
        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'request', id: req.id, data: req }); }} 
        className={`flex items-center px-2 py-1.5 rounded cursor-pointer text-xs transition-all relative group mb-0.5 ${isActive ? 'bg-indigo-50 text-indigo-800 font-semibold ring-1 ring-indigo-200' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
      >
          <span className={`w-10 font-bold text-[9px] mr-1 ${getMethodColor(req.method)}`}>{req.method}</span>
          {editingId === req.id && editingType === 'request' ? (
              <input autoFocus value={editName} onClick={(e)=>e.stopPropagation()} onChange={(e) => setEditName(e.target.value)} onBlur={submitRename} onKeyDown={(e) => e.key === 'Enter' && submitRename()} className="flex-1 text-xs border border-blue-400 rounded px-1 outline-none" />
          ) : (
              <span className="truncate flex-1 select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingId(req.id); setEditingType('request'); setEditName(req.name); }}>{req.name}</span>
          )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 w-72 flex-shrink-0 relative select-none">
      <div className="h-12 px-3 border-b border-gray-200 bg-white flex items-center justify-between">
         <div className="flex items-center">
            <Logo size={22} />
         </div>
         <div className="flex items-center space-x-1">
            <button onClick={onImportCurl} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Import cURL"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2}/></svg></button>
            <button onClick={onCreateCollection} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="New Collection"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeWidth={2}/></svg></button>
            <button onClick={onCreateRequest} className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded" title="New Request"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2}/></svg></button>
            
            <div className="relative" ref={settingsRef}>
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }} 
                    className={`p-1.5 rounded transition-colors ${isSettingsOpen ? 'bg-gray-100 text-gray-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`} 
                    title="Settings"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth={2}/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2}/></svg>
                </button>
                {isSettingsOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-md z-[110] py-1 animate-fadeIn overflow-hidden">
                        <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Version {APP_CONFIG.VERSION}</span>
                        </div>
                        <a href={APP_CONFIG.GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-green-50 transition-colors">
                            <svg className="w-3.5 h-3.5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            GitHub Repository
                        </a>
                        <a href={APP_CONFIG.FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className="flex items-center w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-green-50 transition-colors">
                            <svg className="w-3.5 h-3.5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeWidth={2}/></svg>
                            Send Feedback
                        </a>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onResetAllData(); setIsSettingsOpen(false); }}
                            className="flex items-center w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
                            Reset Workspace
                        </button>
                    </div>
                )}
            </div>

            <button onClick={onCollapseSidebar} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Collapse Sidebar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeWidth={2}/></svg>
            </button>
         </div>
      </div>

      <div className="flex text-xs font-bold border-b border-gray-200 bg-white uppercase tracking-wider">
        <button onClick={() => onTabChange('collections')} className={`flex-1 py-2.5 text-center transition-all ${activeTab === 'collections' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-400 hover:text-gray-600'}`}>Collections</button>
        <button onClick={() => onTabChange('history')} className={`flex-1 py-2.5 text-center transition-all ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-400 hover:text-gray-600'}`}>
            Captured ({history.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'history' ? (
          <div className="divide-y divide-gray-100">
             <div className="p-2 bg-gray-50 flex flex-col space-y-2 sticky top-0 z-10 border-b border-gray-200">
                 <div className="flex items-center justify-between">
                    <button onClick={onToggleRecording} className={`flex items-center px-2 py-1 rounded text-[10px] font-bold border shadow-sm ${isRecording ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-400 border-gray-200'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                        {isRecording ? 'RECORDING' : 'PAUSED'}
                    </button>
                    <button onClick={onClearHistory} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase">Clear</button>
                 </div>
                 <div className="relative">
                    <input 
                        type="text"
                        placeholder="Filter captured requests..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-full text-[10px] pl-7 pr-2 py-1 bg-white border border-gray-200 rounded focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                    <svg className="w-3 h-3 absolute left-2 top-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2}/></svg>
                    {filterText && (
                        <button 
                            onClick={() => setFilterText('')}
                            className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2}/></svg>
                        </button>
                    )}
                 </div>
             </div>
             {filteredHistory.map(item => {
                 const { origin, path } = formatUrl(item.url);
                 const isActive = activeRequestId === item.id;
                 return (
                   <div 
                      key={item.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, item.id)} 
                      className={`px-3 py-2 cursor-pointer transition-colors group relative border-l-4 ${isActive ? 'bg-indigo-50 border-indigo-600' : 'bg-transparent border-transparent hover:bg-white'}`} 
                      onClick={() => onImportLoggedRequest(item)} 
                      onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'log', id: item.id, data: item }); }}
                   >
                       <div className="flex items-center justify-between mb-0.5">
                         <div className="flex items-center space-x-1.5">
                            <span className={`text-[10px] font-bold ${getMethodColor(item.method)}`}>{item.method}</span>
                            <span className="text-[9px] text-gray-400 font-mono">{formatTime(item.timestamp)}</span>
                         </div>
                         <span className={`text-[9px] px-1 rounded font-bold ${item.status >= 400 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{item.status || '...'}</span>
                       </div>
                       <div className={`text-[11px] font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-gray-700'}`}>{origin}</div>
                       <div className="text-[9px] text-gray-400 truncate font-mono opacity-70">{path}</div>
                   </div>
                 );
             })}
             {filteredHistory.length === 0 && history.length > 0 && (
                 <div className="p-4 text-center text-[11px] text-gray-400 italic">No matching requests</div>
             )}
          </div>
        ) : (
          <div className="flex flex-col min-h-full">
            <div 
                className={`flex flex-col p-2 min-h-[40px] transition-colors ${isDragOverRootZone ? 'bg-indigo-100/50 outline-dashed outline-2 outline-indigo-400 rounded-md m-1' : ''}`}
                onDragOver={(e) => handleDragOver(e, null)}
                onDrop={(e) => handleDrop(e, null)}
                onDragLeave={handleDragLeave}
            >
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1">Requests</div>
                <div className="space-y-0.5">
                    {rootRequests.map(renderRequestItem)}
                </div>
            </div>

            <div className="h-px bg-gray-200 my-2 mx-4" />

            <div className="flex flex-col p-2 space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1">Collections</div>
                {collections.map(col => (
                    <div 
                        key={col.id} 
                        className={`rounded-md overflow-hidden transition-all pb-1 ${dragOverColId === col.id ? 'bg-blue-100 outline-dashed outline-2 outline-blue-400 m-0.5' : ''}`} 
                        onDragOver={(e) => handleDragOver(e, col.id)} 
                        onDrop={(e) => handleDrop(e, col.id)} 
                        onDragLeave={handleDragLeave}
                    >
                        <div className="flex items-center px-2 py-2 hover:bg-gray-200 cursor-pointer group" onClick={() => onToggleCollapse(col.id)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'collection', id: col.id, data: col }); }}>
                            <svg className={`w-3.5 h-3.5 text-gray-400 mr-2 transform transition-transform ${col.collapsed ? '-rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                            {editingId === col.id && editingType === 'collection' ? (
                                <input autoFocus value={editName} onClick={(e)=>e.stopPropagation()} onChange={(e) => setEditName(e.target.value)} onBlur={submitRename} onKeyDown={(e) => e.key === 'Enter' && submitRename()} className="flex-1 text-sm border border-blue-400 rounded px-1 outline-none h-6" />
                            ) : (
                                <span className="text-sm font-bold text-gray-700 flex-1 truncate select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingId(col.id); setEditingType('collection'); setEditName(col.name); }}>{col.name}</span>
                            )}
                            <span className="text-[10px] text-gray-400 font-bold ml-1">{col.requests.length}</span>
                        </div>
                        {!col.collapsed && (
                            <div className="ml-5 pl-2 border-l border-gray-200 py-0.5 space-y-0.5 mr-1">
                                {col.requests.map(renderRequestItem)}
                                {col.requests.length === 0 && <div className="text-[10px] text-gray-400 italic py-1 pl-2">Empty</div>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
          <div className="fixed bg-white border border-gray-200 shadow-xl rounded-md py-1.5 z-[100] w-52 animate-fadeIn border-t-2 border-t-indigo-500" style={{ top: contextMenu.y, left: contextMenu.x }}>
              {contextMenu.type === 'log' && (
                  <>
                      <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center" onClick={() => { onMoveRequest(contextMenu.id, null); setContextMenu(null); }}><svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2}/></svg>Save</button>
                      <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center" onClick={() => { copyToClipboard(generateCurl(contextMenu.data)); setContextMenu(null); }}><svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth={2}/></svg>Copy cURL</button>
                  </>
              )}
              {contextMenu.type === 'request' && (
                  <>
                      <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100" onClick={() => { setEditingId(contextMenu.id); setEditingType('request'); setEditName(contextMenu.data.name); setContextMenu(null); }}>Rename</button>
                      <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100" onClick={() => { onDuplicateRequest(contextMenu.id); setContextMenu(null); }}>Duplicate</button>
                      <button className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { onDeleteRequest(contextMenu.data); setContextMenu(null); }}>Delete</button>
                  </>
              )}
              {contextMenu.type === 'collection' && (
                  <>
                      <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100" onClick={() => { setEditingId(contextMenu.id); setEditingType('collection'); setEditName(contextMenu.data.name); setContextMenu(null); }}>Rename</button>
                      <button className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { onDeleteCollection(contextMenu.id); setContextMenu(null); }}>Delete</button>
                  </>
              )}
          </div>
      )}
    </div>
  );
};
