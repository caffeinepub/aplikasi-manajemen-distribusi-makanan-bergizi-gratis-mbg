import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type Kategori = {
    #ibuHamil : ();
    #ibuMenyusui : ();
    #balita : ();
    #tidakDitentukan : ();
  };

  type Status = {
    #aktif;
    #nonAktif;
  };

  type SasaranRecord = {
    id : Nat;
    nama : Text;
    alamat : Text;
    nomorIdentitas : Text;
    kategori : Kategori;
    status : Status;
    catatan : ?Text;
  };

  type Jenis = {
    #paketSembako : ();
    #makananSiapSaji : ();
    #susuTambahan : ();
    #multivitamin : ();
    #lainnya : Text;
  };

  type PaketMBGRecord = {
    id : Nat;
    jenis : Jenis;
    nama : Text;
    keterangan : ?Text;
  };

  type DistribusiStatus = {
    #terdistribusi : ();
    #pending : ();
    #dalamProses : ();
    #tidakTerkirim : ();
  };

  type DistribusiRecord = {
    id : Nat;
    idSasaran : Nat;
    idPaket : Nat;
    tanggalDistribusi : Time.Time;
    jumlahPaket : Nat;
    statusDistribusi : DistribusiStatus;
    keterangan : ?Text;
  };

  type UserProfile = {
    name : Text;
    email : ?Text;
    role : Text;
  };

  type OldActor = {
    sasaranStore : Map.Map<Nat, SasaranRecord>;
    paketStore : Map.Map<Nat, PaketMBGRecord>;
    distribusiStore : Map.Map<Nat, DistribusiRecord>;
    nextId : Map.Map<Text, Nat>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  type NewActor = {
    sasaranStore : Map.Map<Nat, SasaranRecord>;
    paketStore : Map.Map<Nat, PaketMBGRecord>;
    distribusiStore : Map.Map<Nat, DistribusiRecord>;
    nextId : Map.Map<Text, Nat>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
