import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Search, Users, X } from 'lucide-react';
import { Status } from '../backend';
import type { SasaranRecord } from '../backend';

interface BeneficiaryChecklistSelectorProps {
  sasaranList: SasaranRecord[];
  selectedIds: bigint[];
  onChange: (ids: bigint[]) => void;
  disabled?: boolean;
}

interface VillageGroup {
  desa: string;
  sasaran: SasaranRecord[];
}

export default function BeneficiaryChecklistSelector({
  sasaranList,
  selectedIds,
  onChange,
  disabled = false,
}: BeneficiaryChecklistSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDesa, setExpandedDesa] = useState<Set<string>>(new Set());

  // Only show active sasaran
  const activeSasaran = useMemo(
    () => sasaranList.filter((s) => s.status === Status.aktif),
    [sasaranList]
  );

  // Filter by search term
  const filteredSasaran = useMemo(() => {
    if (!searchTerm.trim()) return activeSasaran;
    const lower = searchTerm.toLowerCase();
    return activeSasaran.filter(
      (s) =>
        s.nama.toLowerCase().includes(lower) ||
        s.alamat.toLowerCase().includes(lower)
    );
  }, [activeSasaran, searchTerm]);

  // Group by desa (alamat)
  const villageGroups = useMemo<VillageGroup[]>(() => {
    const map = new Map<string, SasaranRecord[]>();
    for (const s of filteredSasaran) {
      const desa = s.alamat.trim() || 'Tidak Diketahui';
      if (!map.has(desa)) map.set(desa, []);
      map.get(desa)!.push(s);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([desa, sasaran]) => ({ desa, sasaran }));
  }, [filteredSasaran]);

  // Auto-expand groups when searching
  const effectiveExpanded = useMemo(() => {
    if (searchTerm.trim()) {
      return new Set(villageGroups.map((g) => g.desa));
    }
    return expandedDesa;
  }, [searchTerm, villageGroups, expandedDesa]);

  const toggleDesa = (desa: string) => {
    if (searchTerm.trim()) return; // don't toggle when searching
    setExpandedDesa((prev) => {
      const next = new Set(prev);
      if (next.has(desa)) next.delete(desa);
      else next.add(desa);
      return next;
    });
  };

  const toggleSasaran = (id: bigint) => {
    if (disabled) return;
    const exists = selectedIds.some((sid) => sid === id);
    if (exists) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleDesaAll = (group: VillageGroup) => {
    if (disabled) return;
    const groupIds = group.sasaran.map((s) => s.id);
    const allSelected = groupIds.every((id) => selectedIds.some((sid) => sid === id));
    if (allSelected) {
      onChange(selectedIds.filter((sid) => !groupIds.some((id) => id === sid)));
    } else {
      const toAdd = groupIds.filter((id) => !selectedIds.some((sid) => sid === id));
      onChange([...selectedIds, ...toAdd]);
    }
  };

  const removeSelected = (id: bigint) => {
    if (disabled) return;
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  const selectedSasaran = useMemo(
    () => activeSasaran.filter((s) => selectedIds.some((sid) => sid === s.id)),
    [activeSasaran, selectedIds]
  );

  const isDesaAllSelected = (group: VillageGroup) =>
    group.sasaran.length > 0 &&
    group.sasaran.every((s) => selectedIds.some((sid) => sid === s.id));

  const isDesaPartialSelected = (group: VillageGroup) =>
    group.sasaran.some((s) => selectedIds.some((sid) => sid === s.id)) &&
    !isDesaAllSelected(group);

  return (
    <div className="space-y-3">
      {/* Selected summary chips */}
      {selectedSasaran.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="mb-2 text-xs font-semibold text-emerald-700">
            {selectedSasaran.length} penerima dipilih:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedSasaran.map((s) => (
              <Badge
                key={s.id.toString()}
                variant="secondary"
                className="flex items-center gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              >
                <span className="max-w-[120px] truncate text-xs">{s.nama}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeSelected(s.id)}
                    className="ml-0.5 rounded-full hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau desa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>

      {/* Village-grouped checklist */}
      <ScrollArea className="h-64 rounded-md border">
        <div className="p-2">
          {villageGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">
                {searchTerm ? 'Tidak ada sasaran yang sesuai' : 'Belum ada data sasaran aktif'}
              </p>
            </div>
          ) : (
            villageGroups.map((group) => {
              const isOpen = effectiveExpanded.has(group.desa);
              const allSelected = isDesaAllSelected(group);
              const partialSelected = isDesaPartialSelected(group);

              return (
                <Collapsible
                  key={group.desa}
                  open={isOpen}
                  onOpenChange={() => toggleDesa(group.desa)}
                >
                  <div className="mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                    {/* Village-level checkbox */}
                    <Checkbox
                      id={`desa-${group.desa}`}
                      checked={allSelected ? true : partialSelected ? 'indeterminate' : false}
                      onCheckedChange={() => toggleDesaAll(group)}
                      disabled={disabled}
                      className="border-emerald-400 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-2 text-left"
                        disabled={!!searchTerm.trim()}
                      >
                        <span className="flex-1 text-sm font-semibold text-emerald-900">
                          {group.desa}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {group.sasaran.filter((s) => selectedIds.some((sid) => sid === s.id)).length}/
                          {group.sasaran.length}
                        </Badge>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="ml-6 space-y-0.5 border-l border-emerald-100 pl-3">
                      {group.sasaran.map((sasaran) => {
                        const isChecked = selectedIds.some((sid) => sid === sasaran.id);
                        return (
                          <label
                            key={sasaran.id.toString()}
                            className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                              isChecked
                                ? 'bg-emerald-50 text-emerald-900'
                                : 'hover:bg-muted/40'
                            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleSasaran(sasaran.id)}
                              disabled={disabled}
                              className="border-emerald-400 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{sasaran.nama}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {sasaran.nomorIdentitas}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>

      {activeSasaran.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {activeSasaran.length} sasaran aktif tersedia •{' '}
          {selectedIds.length} dipilih
        </p>
      )}
    </div>
  );
}
