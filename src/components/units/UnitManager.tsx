import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Plus, 
  UserCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Building,
  Layers,
  Sparkles,
  UserX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Unit, Membership, User } from '../../types/database';
import { toPersianDigits } from '../../utils/persian';

export const UnitManager: React.FC = () => {
  const { session } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [members, setMembers] = useState<{ user: User; membership: Membership; unit?: Unit }[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // مودال افزودن واحد جدید
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [unitForm, setUnitForm] = useState({
    cooperativeId: '',
    unitNumber: '',
    block: 'A',
    floor: 1,
    areaM2: 100,
    parkingNumber: '',
    storageNumber: ''
  });

  // مودال تخصیص واحد
  const [assigningUnit, setAssigningUnit] = useState<Unit | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    if (!session) return;
    const uList = dataService.getUnits(
      session.activeCooperative?.id || null,
      session.isGlobalSuperAdmin
    );
    const mList = dataService.getMembers(
      session.activeCooperative?.id || null,
      session.isGlobalSuperAdmin
    );
    setUnits(uList);
    setMembers(mList);
  };

  useEffect(() => {
    loadData();
    const unsub = dataService.subscribe(loadData);
    return unsub;
  }, [session]);

  const allCoops = dataService.getAllCooperatives();

  const handleOpenAddUnit = () => {
    setUnitForm({
      cooperativeId: session?.activeCooperative?.id || allCoops[0]?.id || '',
      unitNumber: '',
      block: 'A',
      floor: 1,
      areaM2: 95,
      parkingNumber: '',
      storageNumber: ''
    });
    setError(null);
    setIsAddUnitOpen(true);
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!session) return;

    try {
      const created = dataService.createUnit(unitForm, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`واحد ${created.unitNumber} در بلوک ${created.block} با موفقیت افزوده شد.`);
      setIsAddUnitOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssignUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningUnit || !session) return;
    setError(null);

    try {
      const updated = dataService.assignUnitToMember(
        assigningUnit.id,
        selectedMemberId || null,
        {
          id: session.user.id,
          fullName: session.user.fullName,
          role: session.activeRole
        }
      );

      setSuccessMsg(
        selectedMemberId
          ? `واحد ${updated.unitNumber} با موفقیت به عضو تخصیص داده شد.`
          : `تخصیص واحد ${updated.unitNumber} با موفقیت لغو شد.`
      );
      setAssigningUnit(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // استخراج بلوک‌های منحصربه‌فرد برای فیلتر
  const uniqueBlocks = Array.from(new Set(units.map(u => u.block)));

  const filteredUnits = units.filter(u => {
    const matchesBlock = selectedBlock === 'all' || u.block === selectedBlock;
    const matchesSearch = u.unitNumber.includes(searchTerm) || u.block.includes(searchTerm);
    return matchesBlock && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* سربرگ بخش واحدها */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">مدیریت و ماتریس واحدهای مسکونی</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تعریف متراژ، طبقات، بلوک‌بندی، پارکینگ، انباری و فرآیند تخصیص رسمی واحد به اعضا
          </p>
        </div>

        {session?.activeRole !== 'MEMBER' && (
          <button
            onClick={handleOpenAddUnit}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>تعریف واحد مسکونی جدید</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* نوار فیلتر بلوک‌ها و جستجو */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="جستجوی شماره واحد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-slate-200 text-xs outline-none focus:border-emerald-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedBlock('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all ${
              selectedBlock === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            همه بلوک‌ها ({toPersianDigits(units.length)})
          </button>

          {uniqueBlocks.map(block => (
            <button
              key={block}
              onClick={() => setSelectedBlock(block)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all ${
                selectedBlock === block
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              بلوک {block} ({toPersianDigits(units.filter(u => u.block === block).length)})
            </button>
          ))}
        </div>
      </div>

      {/* گرید کارت‌های واحدها */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUnits.map((unit) => {
          const assignedMember = members.find(m => m.membership.id === unit.assignedMemberId);
          const isAssigned = unit.status === 'ASSIGNED';

          return (
            <div
              key={unit.id}
              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                isAssigned ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-xl">
                    بلوک {unit.block} - ط {toPersianDigits(unit.floor)}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAssigned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isAssigned ? 'تخصیص‌یافته' : 'موجود (آزاد)'}
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-black text-slate-900">واحد {toPersianDigits(unit.unitNumber)}</h4>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">
                    متراژ: {toPersianDigits(unit.areaM2)} مترمربع
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                  <div>پارکینگ: {unit.parkingNumber || 'ندارد'}</div>
                  <div>انباری: {unit.storageNumber || 'ندارد'}</div>
                </div>
              </div>

              {/* مشخصات عضو منتسب */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                {isAssigned && assignedMember ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={assignedMember.user.avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate">{assignedMember.user.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{assignedMember.membership.membershipNumber}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-700 font-medium text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>آماده واگذاری به اعضا</span>
                  </div>
                )}

                {session?.activeRole !== 'MEMBER' && (
                  <button
                    onClick={() => {
                      setAssigningUnit(unit);
                      setSelectedMemberId(unit.assignedMemberId || '');
                      setError(null);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAssigned ? 'تغییر یا لغو تخصیص' : 'تخصیص به عضو'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* مودال تعریف واحد جدید */}
      {isAddUnitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">تعریف واحد مسکونی جدید در پروژه</h3>
              </div>
              <button
                onClick={() => setIsAddUnitOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">تعاونی مسکن *</label>
                <select
                  value={unitForm.cooperativeId}
                  onChange={e => setUnitForm({ ...unitForm, cooperativeId: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white font-medium outline-none"
                >
                  {allCoops.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.projectName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">شماره واحد *</label>
                  <input
                    type="text"
                    required
                    placeholder="۱۰۱"
                    value={unitForm.unitNumber}
                    onChange={e => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">نام / شناسه بلوک *</label>
                  <input
                    type="text"
                    required
                    placeholder="A یا بهار"
                    value={unitForm.block}
                    onChange={e => setUnitForm({ ...unitForm, block: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">طبقه *</label>
                  <input
                    type="number"
                    required
                    value={unitForm.floor}
                    onChange={e => setUnitForm({ ...unitForm, floor: parseInt(e.target.value) || 1 })}
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">متراژ مفید (متر مربع) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={unitForm.areaM2}
                    onChange={e => setUnitForm({ ...unitForm, areaM2: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">شماره پارکینگ</label>
                  <input
                    type="text"
                    placeholder="P-14"
                    value={unitForm.parkingNumber}
                    onChange={e => setUnitForm({ ...unitForm, parkingNumber: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">شماره انباری</label>
                  <input
                    type="text"
                    placeholder="S-03"
                    value={unitForm.storageNumber}
                    onChange={e => setUnitForm({ ...unitForm, storageNumber: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUnitOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer shadow-sm"
                >
                  ثبت واحد در پروژه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تخصیص واحد به عضو */}
      {assigningUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">تخصیص واحد {toPersianDigits(assigningUnit.unitNumber)} به عضو</h3>
              </div>
              <button
                onClick={() => setAssigningUnit(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignUnit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  واحد {toPersianDigits(assigningUnit.unitNumber)} (بلوک {assigningUnit.block} - طبقه {toPersianDigits(assigningUnit.floor)})
                </div>
                <div className="text-slate-500">متراژ: {toPersianDigits(assigningUnit.areaM2)} مترمربع</div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">انتخاب عضو تعاونی جهت واگذاری:</label>
                <select
                  value={selectedMemberId}
                  onChange={e => setSelectedMemberId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white font-medium outline-none"
                >
                  <option value="">-- فاقد عضو (آزاد کردن واحد) --</option>
                  {members
                    .filter(m => m.membership.cooperativeId === assigningUnit.cooperativeId)
                    .map(m => (
                      <option key={m.membership.id} value={m.membership.id}>
                        {m.user.fullName} ({m.membership.membershipNumber}) {m.unit && m.unit.id !== assigningUnit.id ? '(دارای واحد دیگر)' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAssigningUnit(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer shadow-sm"
                >
                  ثبت تخصیص
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
