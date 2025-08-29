import subprocess
import sys

def test_stderr_stdout():
    # Testa se logs vão para stderr e JSON para stdout
    import os
    script = os.path.join(os.path.dirname(__file__), "main.py")
    json_path = os.path.join(os.path.dirname(__file__), "exemplo_busca_hibrida.json")
    cmd = [sys.executable, script, "--only-buscar_hibrido_ponderado"]
    with open(json_path, "rb") as f:
        proc = subprocess.Popen(cmd, stdin=f, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, err = proc.communicate()
    print("STDOUT (apenas linhas com [RESULTADO_JSON]):")
    for line in out.decode().splitlines():
        if line.startswith("[RESULTADO_JSON]"):
            print(line)
    print("\nSTDERR:")
    print(err.decode())

if __name__ == "__main__":
    test_stderr_stdout()