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

import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";

// Use stable migration mechanism to preserve persistent data across upgrades. Not needed for var entries but always use it when you persist the data. With persistent data, also aggregation variables must be migrated!

actor {
  // ================= Persistent State Variables =================
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let sasaranStore = Map.empty<Nat, Sasaran.SasaranRecord>();
  let paketStore = Map.empty<Nat, PaketMBG.PaketMBGRecord>();
  let distribusiStore = Map.empty<Nat, Distribusi.DistribusiRecord>();
  let nextId = Map.empty<Text, Nat>();
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

  // ================= Sasaran Operations =====================
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

  public query func getSasaran(_id : Nat) : async ?Sasaran.SasaranRecord {
    sasaranStore.get(_id);
  };

  public query func getSemuaSasaran() : async [Sasaran.SasaranRecord] {
    sasaranStore.values().toArray();
  };

  public query func filterSasaranByStatus(aktif : Bool) : async [Sasaran.SasaranRecord] {
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

  public query func cariSasaranByNama(nama : Text) : async [Sasaran.SasaranRecord] {
    let results = sasaranStore.values().toArray().filter(
      func(s) { s.nama.contains(#text nama) }
    );
    results;
  };

  public query func filterSasaranByKategori(kategori : Sasaran.Kategori) : async [Sasaran.SasaranRecord] {
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

  // ================= Paket Operations =====================
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

  public query func getPaket(_id : Nat) : async ?PaketMBG.PaketMBGRecord {
    paketStore.get(_id);
  };

  public query func getSemuaPaket() : async [PaketMBG.PaketMBGRecord] {
    paketStore.values().toArray();
  };

  // ================= Distribusi Operations =====================
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

  // Edit distribusi record
  public shared ({ caller }) func editDistribusi(
    id : Nat,
    idPaket : Nat,
    jumlahPaket : Nat,
    tanggalDistribusi : Time.Time,
    statusDistribusi : Distribusi.DistribusiStatus,
    keterangan : ?Text
  ) : async Distribusi.DistribusiRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can edit distribusi");
    };
    switch (distribusiStore.get(id)) {
      case (null) { Runtime.trap("Distribusi tidak ditemukan") };
      case (?existing) {
        switch (paketStore.get(idPaket)) {
          case (null) { Runtime.trap("Paket tidak ditemukan") };
          case (?_) {
            let updated : Distribusi.DistribusiRecord = {
              existing with
              idPaket;
              jumlahPaket;
              tanggalDistribusi;
              statusDistribusi;
              keterangan;
            };
            distribusiStore.add(id, updated);
            updated;
          };
        };
      };
    };
  };

  // ================= Queries: Distribusi =====================
  public query func getDistribusi(_id : Nat) : async ?Distribusi.DistribusiRecord {
    distribusiStore.get(_id);
  };

  public query func getSemuaDistribusi() : async [Distribusi.DistribusiRecord] {
    distribusiStore.values().toArray();
  };

  public query func getDistribusiBySasaran(idSasaran : Nat) : async [Distribusi.DistribusiRecord] {
    let filtered = distribusiStore.values().toArray().filter(
      func(d) { d.idSasaran == idSasaran }
    );
    filtered;
  };

  public query func getDistribusiByPaket(idPaket : Nat) : async [Distribusi.DistribusiRecord] {
    let filtered = distribusiStore.values().toArray().filter(
      func(d) { d.idPaket == idPaket }
    );
    filtered;
  };

  public query func getDistribusiByStatus(status : Distribusi.DistribusiStatus) : async [Distribusi.DistribusiRecord] {
    let filtered = distribusiStore.values().toArray().filter(
      func(d) { d.statusDistribusi == status }
    );
    filtered;
  };

  public query func filterDistribusiByTanggal(start : Time.Time, end : Time.Time) : async [Distribusi.DistribusiRecord] {
    distribusiStore.values().toArray().filter(
      func(d) { d.tanggalDistribusi >= start and d.tanggalDistribusi <= end }
    );
  };

  // ================= Report Queries =====================
  public query func getDataUntukLaporan(start : Time.Time, end : Time.Time) : async {
    sasaran : [Sasaran.SasaranRecord];
    paket : [PaketMBG.PaketMBGRecord];
    distribusi : [Distribusi.DistribusiRecord];
  } {
    let filteredDistribusi = distribusiStore.values().toArray().filter(
      func(d) { d.tanggalDistribusi >= start and d.tanggalDistribusi <= end }
    );

    {
      sasaran = sasaranStore.values().toArray();
      paket = paketStore.values().toArray();
      distribusi = filteredDistribusi;
    };
  };

  public query func getLaporanByKategori(kategori : Sasaran.Kategori, start : Time.Time, end : Time.Time) : async {
    sasaran : [Sasaran.SasaranRecord];
    paket : [PaketMBG.PaketMBGRecord];
    distribusi : [Distribusi.DistribusiRecord];
  } {
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

  public query func getStatistikDistribusi() : async { totalSasaran : Nat; totalPaket : Nat; totalDistribusi : Nat } {
    {
      totalSasaran = sasaranStore.size();
      totalPaket = paketStore.size();
      totalDistribusi = distribusiStore.size();
    };
  };

  // ================= Sorting Support for Frontend =====================
  public query func getSemuaSasaranSortedByNama() : async [Sasaran.SasaranRecord] {
    sasaranStore.values().toArray().sort(Sasaran.compareByNama);
  };

  public query func getSemuaSasaranSortedById() : async [Sasaran.SasaranRecord] {
    sasaranStore.values().toArray().sort(Sasaran.compareById);
  };

  public query func getSemuaPaketSortedByNama() : async [PaketMBG.PaketMBGRecord] {
    paketStore.values().toArray().sort(PaketMBG.compareByNama);
  };

  public query func getSemuaPaketSortedById() : async [PaketMBG.PaketMBGRecord] {
    paketStore.values().toArray().sort(PaketMBG.compareById);
  };

  public query func getSemuaDistribusiSortedByTanggal() : async [Distribusi.DistribusiRecord] {
    distribusiStore.values().toArray().sort(Distribusi.compareByTanggal);
  };

  public query func getSemuaDistribusiSortedById() : async [Distribusi.DistribusiRecord] {
    distribusiStore.values().toArray().sort(Distribusi.compareById);
  };
};
