{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  NIX_SHELL = "notioncms";
  
  buildInputs = [    
    pkgs.nodejs-14_x
    (pkgs.yarn.override {
        nodejs = pkgs.nodejs-14_x;
    })
  ];
}
