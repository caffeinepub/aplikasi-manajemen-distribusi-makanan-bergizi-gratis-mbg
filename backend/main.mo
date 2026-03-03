import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

// Use stable migration mechanism to preserve persistent data across upgrades. Not needed for var entries but always use it when you persist the data. With persistent data, also aggregation variables must be migrated!
(with migration = Migration.run)
actor {
  include MixinStorage();

  // ================= Persistent State Variables =================
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let sasaranStore = Map.empty<Nat, Sasaran.SasaranRecord>();
  let paketStore = Map.empty<Nat, PaketMBG.PaketMBGRecord>();
  let distribusiStore = Map.empty<Nat, Distribusi.DistribusiRecord>();
  var nextId = Map.empty<Text, Nat>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ================= Helper Functions =================
  func incrementAndGetId(entity : Text) : Nat {
    let id = switch (nextId.get(entity)) {
      case (null) { 0 };
      case (?current) { current + 1 };
    };
    nextId.add(entity, id);
    id;
  };

  // ================= User Profile Management =====================
  public type UserProfile = {
    name : Text;
    email : ?Text;
    role : Text;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ================= Types & Modules =====================
  // Sasaran (Beneficiary) Types
  module Sasaran {
    public type Kategori = {
      #ibuHamil : ();
      #ibuMenyusui : ();
      #balita : ();
      #tidakDitentukan : ();
    };

    public type Status = {
      #aktif;
      #nonAktif;
    };

    public type SasaranRecord = {
      id : Nat;
      nama : Text;
      alamat : Text;
      nomorIdentitas : Text;
      kategori : Kategori;
      status : Status;
      catatan : ?Text;
    };

    public func compareByNama(a : SasaranRecord, b : SasaranRecord) : Order.Order {
      Text.compare(a.nama, b.nama);
    };

    public func compareById(a : SasaranRecord, b : SasaranRecord) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // Package (Paket) Types
  module PaketMBG {
    public type Jenis = {
      #paketSembako : ();
      #makananSiapSaji : ();
      #susuTambahan : ();
      #multivitamin : ();
      #lainnya : Text;
    };

    public type PaketMBGRecord = {
      id : Nat;
      jenis : Jenis;
      nama : Text;
      keterangan : ?Text;
    };

    public func compareByNama(a : PaketMBGRecord, b : PaketMBGRecord) : Order.Order {
      Text.compare(a.nama, b.nama);
    };

    public func compareById(a : PaketMBGRecord, b : PaketMBGRecord) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // Distribution (Distribusi) Types
  module Distribusi {
    public type DistribusiStatus = {
      #terdistribusi : ();
      #pending : ();
      #dalamProses : ();
      #tidakTerkirim : ();
    };

    public type DistribusiRecord = {
      id : Nat;
      idSasaran : Nat;
      idPaket : Nat;
      tanggalDistribusi : Time.Time;
      jumlahPaket : Nat;
      statusDistribusi : DistribusiStatus;
      keterangan : ?Text;
    };

    public func compareByTanggal(a : DistribusiRecord, b : DistribusiRecord) : Order.Order {
      Int.compare(a.tanggalDistribusi, b.tanggalDistribusi);
    };

    public func compareById(a : DistribusiRecord, b : DistribusiRecord) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module BatchedDistribusi {
    public type PendingBatchedDistribusi = {
      sasaranIds : [Nat];
      idPaket : Nat;
      jumlahPaket : Nat;
      statusDistribusi : Distribusi.DistribusiStatus;
      keterangan : ?Text;
      tanggalDistribusi : Time.Time;
    };

    public type BatchedDistribusiResult = {
      sukses : [Distribusi.DistribusiRecord];
      gagal : [
        {
          sasaranId : Nat;
          error : Text;
        }
      ];
    };
  };

  // ================= Sasaran Operations (Authenticated Users Only) =====================
  public shared ({ caller }) func tambahSasaran(nama : Text, alamat : Text, nomorIdentitas : Text, catatan : ?Text, kategori : ?Sasaran.Kategori) : async Sasaran.SasaranRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add sasaran");
    };
    let id = incrementAndGetId("sasaran");
    let sasaran : Sasaran.SasaranRecord = {
      id;
      nama;
      alamat;
      nomorIdentitas;
      kategori = switch (kategori) {
        case (null) { #tidakDitentukan };
        case (?k) { k };
      };
      status = #aktif;
      catatan;
    };
    sasaranStore.add(id, sasaran);
    sasaran;
  };

  public query ({ caller }) func getSasaran(_id : Nat) : async ?Sasaran.SasaranRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view sasaran");
    };
    sasaranStore.get(_id);
  };

  public query ({ caller }) func getSemuaSasaran() : async [Sasaran.SasaranRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view sasaran");
    };
    sasaranStore.values().toArray();
  };

  public query ({ caller }) func filterSasaranByStatus(aktif : Bool) : async [Sasaran.SasaranRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can filter sasaran");
    };
    let filtered = sasaranStore.values().toArray().filter(
      func(s) {
        switch (s.status, aktif) {
          case (#aktif, true) { true };
          case (#nonAktif, false) { true };
          case (_) { false };
        };
      }
    );
    filtered;
  };

  public query ({ caller }) func cariSasaranByNama(nama : Text) : async [Sasaran.SasaranRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can search sasaran");
    };
    let results = sasaranStore.values().toArray().filter(
      func(s) { s.nama.contains(#text nama) }
    );
    results;
  };

  public query ({ caller }) func filterSasaranByKategori(kategori : Sasaran.Kategori) : async [Sasaran.SasaranRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can filter sasaran by kategori");
    };
    let results = sasaranStore.values().toArray().filter(
      func(s) { s.kategori == kategori }
    );
    results;
  };

  public shared ({ caller }) func ubahStatusSasaran(id : Nat, aktif : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update sasaran status");
    };
    switch (sasaranStore.get(id)) {
      case (null) { Runtime.trap("Sasaran tidak ditemukan") };
      case (?sasaran) {
        let status = if (aktif) { #aktif } else { #nonAktif };
        let updated = {
          sasaran with
          status;
        };
        sasaranStore.add(id, updated);
      };
    };
  };

  // ================= Paket Operations (Authenticated Users Only) =====================
  public shared ({ caller }) func tambahPaket(jenis : PaketMBG.Jenis, nama : Text, keterangan : ?Text) : async PaketMBG.PaketMBGRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add paket");
    };
    let id = incrementAndGetId("paket");
    let paket : PaketMBG.PaketMBGRecord = {
      id;
      jenis;
      nama;
      keterangan;
    };
    paketStore.add(id, paket);
    paket;
  };

  public query ({ caller }) func getPaket(_id : Nat) : async ?PaketMBG.PaketMBGRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view paket");
    };
    paketStore.get(_id);
  };

  public query ({ caller }) func getSemuaPaket() : async [PaketMBG.PaketMBGRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view paket");
    };
    paketStore.values().toArray();
  };

  // ================= Distribusi Operations (Authenticated Users Only) =====================
  public shared ({ caller }) func catatDistribusiBatched(pending : BatchedDistribusi.PendingBatchedDistribusi) : async BatchedDistribusi.BatchedDistribusiResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can record distribusi");
    };

    switch (paketStore.get(pending.idPaket)) {
      case (null) {
        Runtime.trap("Paket tidak ditemukan");
      };
      case (?_) {
        let now = pending.tanggalDistribusi;

        let hasilDistribusi = pending.sasaranIds.map(
          func(idSasaran) {
            switch (sasaranStore.get(idSasaran)) {
              case (null) {
                #gagal({ sasaranId = idSasaran; error = "Sasaran tidak ditemukan" });
              };
              case (?_) {
                let id = incrementAndGetId("distribusi");
                let distribusi : Distribusi.DistribusiRecord = {
                  id;
                  idSasaran;
                  idPaket = pending.idPaket;
                  tanggalDistribusi = now;
                  jumlahPaket = pending.jumlahPaket;
                  statusDistribusi = pending.statusDistribusi;
                  keterangan = pending.keterangan;
                };
                distribusiStore.add(id, distribusi);
                #sukses(distribusi);
              };
            };
          }
        );

        let sukses = hasilDistribusi.filterMap(
          func(res) {
            switch (res) {
              case (#sukses(record)) { ?record };
              case (_) { null };
            };
          }
        );

        let gagal = hasilDistribusi.filterMap(
          func(res) {
            switch (res) {
              case (#gagal(errorInfo)) { ?errorInfo };
              case (_) { null };
            };
          }
        );

        { sukses; gagal };
      };
    };
  };

  // ================= Queries: Distribusi =====================
  public query ({ caller }) func getDistribusi(_id : Nat) : async ?Distribusi.DistribusiRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view distribusi");
    };
    distribusiStore.get(_id);
  };

  public query ({ caller }) func getSemuaDistribusi() : async [Distribusi.DistribusiRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view distribusi");
    };
    distribusiStore.values().toArray();
  };

  public query ({ caller }) func getDistribusiBySasaran(idSasaran : Nat) : async [Distribusi.DistribusiRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view distribusi");
    };
    let filtered = distribusiStore.values().toArray().filter(
      func(d) { d.idSasaran == idSasaran }
    );
    filtered;
  };

  public query ({ caller }) func getDistribusiByPaket(idPaket : Nat) : async [Distribusi.DistribusiRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view distribusi");
    };
    let filtered = distribusiStore.values().toArray().filter(
      func(d) { d.idPaket == idPaket }
    );
    filtered;
  };

  public query ({ caller }) func getDistribusiByStatus(status : Distribusi.DistribusiStatus) : async [Distribusi.DistribusiRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view distribusi");
    };
    let filtered = distribusiStore.values().toArray().filter(
      func(d) { d.statusDistribusi == status }
    );
    filtered;
  };

  public query ({ caller }) func filterDistribusiByTanggal(start : Time.Time, end : Time.Time) : async [Distribusi.DistribusiRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can filter distribusi");
    };
    distribusiStore.values().toArray().filter(
      func(d) { d.tanggalDistribusi >= start and d.tanggalDistribusi <= end }
    );
  };

  // ================= Report Queries =====================
  public query ({ caller }) func getDataUntukLaporan(start : Time.Time, end : Time.Time) : async {
    sasaran : [Sasaran.SasaranRecord];
    paket : [PaketMBG.PaketMBGRecord];
    distribusi : [Distribusi.DistribusiRecord];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can generate reports");
    };
    let filteredDistribusi = distribusiStore.values().toArray().filter(
      func(d) { d.tanggalDistribusi >= start and d.tanggalDistribusi <= end }
    );

    {
      sasaran = sasaranStore.values().toArray();
      paket = paketStore.values().toArray();
      distribusi = filteredDistribusi;
    };
  };

  public query ({ caller }) func getLaporanByKategori(kategori : Sasaran.Kategori, start : Time.Time, end : Time.Time) : async {
    sasaran : [Sasaran.SasaranRecord];
    paket : [PaketMBG.PaketMBGRecord];
    distribusi : [Distribusi.DistribusiRecord];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can generate reports by kategori");
    };
    let distribusiInRange = distribusiStore.values().toArray().filter(
      func(d) { d.tanggalDistribusi >= start and d.tanggalDistribusi <= end }
    );

    let sasaranByCategory = sasaranStore.values().toArray().filter(
      func(s) { s.kategori == kategori }
    );

    let distribusiByCategory = distribusiInRange.filter(
      func(d) {
        switch (sasaranStore.get(d.idSasaran)) {
          case (null) { false };
          case (?s) { s.kategori == kategori };
        };
      }
    );

    {
      sasaran = sasaranByCategory;
      paket = paketStore.values().toArray();
      distribusi = distribusiByCategory;
    };
  };

  public query ({ caller }) func getStatistikDistribusi() : async { totalSasaran : Nat; totalPaket : Nat; totalDistribusi : Nat } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view statistics");
    };
    {
      totalSasaran = sasaranStore.size();
      totalPaket = paketStore.size();
      totalDistribusi = distribusiStore.size();
    };
  };

  // ================= Sorting Support for Frontend =====================
  public query ({ caller }) func getSemuaSasaranSortedByNama() : async [Sasaran.SasaranRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view sasaran");
    };
    sasaranStore.values().toArray().sort(Sasaran.compareByNama);
  };

  public query ({ caller }) func getSemuaSasaranSortedById() : async [Sasaran.SasaranRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view sasaran");
    };
    sasaranStore.values().toArray().sort(Sasaran.compareById);
  };

  public query ({ caller }) func getSemuaPaketSortedByNama() : async [PaketMBG.PaketMBGRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view paket");
    };
    paketStore.values().toArray().sort(PaketMBG.compareByNama);
  };

  public query ({ caller }) func getSemuaPaketSortedById() : async [PaketMBG.PaketMBGRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view paket");
    };
    paketStore.values().toArray().sort(PaketMBG.compareById);
  };

  public query ({ caller }) func getSemuaDistribusiSortedByTanggal() : async [Distribusi.DistribusiRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view distribusi");
    };
    distribusiStore.values().toArray().sort(Distribusi.compareByTanggal);
  };

  public query ({ caller }) func getSemuaDistribusiSortedById() : async [Distribusi.DistribusiRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view distribusi");
    };
    distribusiStore.values().toArray().sort(Distribusi.compareById);
  };
};
