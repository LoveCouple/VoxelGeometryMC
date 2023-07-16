// === CONFIGURABLE VARIABLES
const bpfoldername = "gen";
const useMinecraftPreview = false; // Whether to target the "Minecraft Preview" version of Minecraft vs. the main store version of Minecraft
const useMinecraftDedicatedServer = false; // Whether to use Bedrock Dedicated Server - see https://www.minecraft.net/download/server/bedrock
const dedicatedServerPath = "C:/mc/bds/1.19.0/"; // if using Bedrock Dedicated Server, where to find the extracted contents of the zip package

// === END CONFIGURABLE VARIABLES
const zip = require("gulp-zip");
const gulp = require("gulp");
const ts = require("gulp-typescript");
const del = require("del");
const os = require("os");
const spawn = require("child_process").spawn;
const sourcemaps = require("gulp-sourcemaps");
const gulpEsbuild = require("gulp-esbuild");
const Vinyl = require("vinyl");

const worldsFolderName = useMinecraftDedicatedServer ? "worlds" : "minecraftWorlds";

const activeWorldFolderName = useMinecraftDedicatedServer ? "Bedrock level" : bpfoldername + "world";

const get_Mojang_dir = () => {
  const homeDir = os.homedir();
  switch (process.platform) {
    case "win32":
      return homeDir + useMinecraftPreview
        ? "/AppData/Local/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/"
        : "/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/";
    case "linux":
      return homeDir + "/.var/app/io.mrarm.mcpelauncher/data/mcpelauncher/games/com.mojang/";
    case "android":
      break;
  }
};
const mcdir = get_Mojang_dir();

function clean_build(callbackFunction) {
  del(["build/behavior_packs/", "build/resource_packs/"]).then(
    (value) => {
      callbackFunction(); // success
    },
    (reason) => {
      callbackFunction(); // error
    }
  );
}

function copy_behavior_packs() {
  return gulp.src(["behavior_packs/**/*"]).pipe(gulp.dest("build/behavior_packs"));
}

function copy_resource_packs() {
  return gulp.src(["resource_packs/**/*"]).pipe(gulp.dest("build/resource_packs"));
}

function string_src(filename, string) {
  var src = require("stream").Readable({ objectMode: true });
  src._read = function () {
    this.push(
      new Vinyl({
        cwd: "",
        base: null,
        path: filename,
        contents: Buffer.from(string, "utf-8"),
      })
    );
    this.push(null);
  };
  return src;
}

function esbuild_system() {
  return gulp
    .src("./build/scripts/main.js")
    .pipe(
      gulpEsbuild({
        outfile: "main.js",
        bundle: true,
        external: ["@minecraft/server-ui", "@minecraft/server"],
        format: "esm",
      })
    )
    .pipe(gulp.dest("./build/behavior_packs/gen/scripts"));
}

function pack_zip() {
  return gulp.src("./build/behavior_packs/gen/**/*").pipe(zip("VoxelGeometry.mcpack")).pipe(gulp.dest("./"));
}

function exact_version() {
  var pkg = require("./behavior_packs/gen/manifest.json");
  return string_src("version", pkg.header.version.join(".")).pipe(gulp.dest("./"));
}

const copy_content = gulp.parallel(copy_behavior_packs, copy_resource_packs);

function compile_scripts() {
  return gulp
    .src("scripts/*")
    .pipe(sourcemaps.init())
    .pipe(
      ts({
        module: "es2020",
        moduleResolution: "node",
        lib: ["es2020", "dom"],
        strict: true,
        target: "es2020",
        noImplicitAny: true,
      })
    )
    .pipe(
      sourcemaps.write("../../_" + bpfoldername + "Debug", {
        destPath: bpfoldername + "/scripts/",
      })
    )
    .pipe(gulp.dest("build/scripts"));
}

const build = gulp.series(clean_build, copy_content, compile_scripts, esbuild_system, pack_zip, exact_version);

function clean_localmc(callbackFunction) {
  if (!bpfoldername || !bpfoldername.length || bpfoldername.length < 2) {
    console.log("No bpfoldername specified.");
    callbackFunction();
    return;
  }

  del([mcdir + "development_behavior_packs/" + bpfoldername, mcdir + "development_resource_packs/" + bpfoldername], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function deploy_localmc_behavior_packs() {
  console.log("Deploying to '" + mcdir + "development_behavior_packs/" + bpfoldername + "'");
  return gulp
    .src(["build/behavior_packs/" + bpfoldername + "/**/*"])
    .pipe(gulp.dest(mcdir + "development_behavior_packs/" + bpfoldername));
}

function deploy_localmc_resource_packs() {
  return gulp
    .src(["build/resource_packs/" + bpfoldername + "/**/*"])
    .pipe(gulp.dest(mcdir + "development_resource_packs/" + bpfoldername));
}

function getTargetWorldPath() {
  return mcdir + worldsFolderName + "/" + activeWorldFolderName;
}

function getTargetConfigPath() {
  return mcdir + "config";
}

function getTargetWorldBackupPath() {
  return "backups/worlds/" + activeWorldFolderName;
}

function getDevConfigPath() {
  return "config";
}

function getDevWorldPath() {
  return "worlds/default";
}

function getDevWorldBackupPath() {
  return "backups/worlds/devdefault";
}

function clean_localmc_world(callbackFunction) {
  console.log("Removing '" + getTargetWorldPath() + "'");

  del([getTargetWorldPath()], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function clean_localmc_config(callbackFunction) {
  console.log("Removing '" + getTargetConfigPath() + "'");

  del([getTargetWorldPath()], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function clean_dev_world(callbackFunction) {
  console.log("Removing '" + getDevWorldPath() + "'");

  del([getDevWorldPath()], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function clean_localmc_world_backup(callbackFunction) {
  console.log("Removing backup'" + getTargetWorldBackupPath() + "'");

  del([getTargetWorldBackupPath()], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function clean_dev_world_backup(callbackFunction) {
  console.log("Removing backup'" + getDevWorldBackupPath() + "'");

  del([getTargetWorldBackupPath()], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function backup_dev_world() {
  console.log("Copying world '" + getDevWorldPath() + "' to '" + getDevWorldBackupPath() + "'");
  return gulp
    .src([getTargetWorldPath() + "/**/*"])
    .pipe(gulp.dest(getDevWorldBackupPath() + "/worlds/" + activeWorldFolderName));
}

function deploy_localmc_config() {
  console.log("Copying world 'config/' to '" + getTargetConfigPath() + "'");
  return gulp.src([getDevConfigPath() + "/**/*"]).pipe(gulp.dest(getTargetConfigPath()));
}

function deploy_localmc_world() {
  console.log("Copying world 'worlds/default/' to '" + getTargetWorldPath() + "'");
  return gulp.src([getDevWorldPath() + "/**/*"]).pipe(gulp.dest(getTargetWorldPath()));
}

function ingest_localmc_world() {
  console.log("Ingesting world '" + getTargetWorldPath() + "' to '" + getDevWorldPath() + "'");
  return gulp.src([getTargetWorldPath() + "/**/*"]).pipe(gulp.dest(getDevWorldPath()));
}

function backup_localmc_world() {
  console.log("Copying world '" + getTargetWorldPath() + "' to '" + getTargetWorldBackupPath() + "/'");
  return gulp
    .src([getTargetWorldPath() + "/**/*"])
    .pipe(gulp.dest(getTargetWorldBackupPath() + "/" + activeWorldFolderName));
}

const deploy_localmc = gulp.series(
  clean_localmc,
  function (callbackFunction) {
    if (!useMinecraftDedicatedServer) {
      console.log("\007"); // annunciate a beep!
    }
    callbackFunction();
  },
  gulp.parallel(deploy_localmc_behavior_packs, deploy_localmc_resource_packs)
);

function watch() {
  return gulp.watch(
    ["scripts/**/*.ts", "behavior_packs/**/*", "resource_packs/**/*"],
    gulp.series(build, deploy_localmc)
  );
}

function serve() {
  return gulp.watch(
    ["scripts/**/*.ts", "behavior_packs/**/*", "resource_packs/**/*"],
    gulp.series(stopServer, build, deploy_localmc, startServer)
  );
}

let activeServer = null;

function stopServer(callbackFunction) {
  if (activeServer) {
    activeServer.stdin.write("stop\n");
    activeServer = null;
  }

  callbackFunction();
}

function startServer(callbackFunction) {
  if (activeServer) {
    activeServer.stdin.write("stop\n");
    activeServer = null;
  }

  activeServer = spawn(dedicatedServerPath + "bedrock_server");

  let logBuffer = "";

  let serverLogger = function (buffer) {
    let incomingBuffer = buffer.toString();

    if (incomingBuffer.endsWith("\n")) {
      (logBuffer + incomingBuffer).split(/\n/).forEach(function (message) {
        if (message) {
          if (message.indexOf("Server started.") >= 0) {
            activeServer.stdin.write("script debugger listen 19144\n");
            console.log("\007"); // annunciate a beep!
          }
          console.log("Server: " + message);
        }
      });
      logBuffer = "";
    } else {
      logBuffer += incomingBuffer;
    }
  };

  activeServer.stdout.on("data", serverLogger);
  activeServer.stderr.on("data", serverLogger);

  callbackFunction();
}

function insert(str, index, value) {
  return str.substr(0, index) + value + str.substr(index);
}

exports.clean_build = clean_build;
exports.copy_behavior_packs = copy_behavior_packs;
exports.copy_resource_packs = copy_resource_packs;
exports.compile_scripts = compile_scripts;
exports.copy_content = copy_content;
exports.build = build;
exports.exact_version = exact_version;
exports.clean_localmc = clean_localmc;
exports.deploy_localmc = deploy_localmc;
exports.default = gulp.series(build, deploy_localmc);
exports.clean = gulp.series(clean_build, clean_localmc);
exports.watch = gulp.series(build, deploy_localmc, watch);
exports.serve = gulp.series(build, deploy_localmc, startServer, serve);
exports.updateworld = gulp.series(
  clean_localmc_world_backup,
  backup_localmc_world,
  clean_localmc_world,
  deploy_localmc_world
);
exports.ingestworld = gulp.series(clean_dev_world_backup, backup_dev_world, clean_dev_world, ingest_localmc_world);
exports.updateconfig = gulp.series(clean_localmc_config, deploy_localmc_config);
