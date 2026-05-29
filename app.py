from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

patients = []
id_counter = 1


# ── HOME ROUTE ──
@app.route("/")
def index():
    return render_template("index.html")


def find_patient(patient_id):
    return next((p for p in patients if p["id"] == patient_id), None)


# GET all patients
@app.route("/api/patients", methods=["GET"])
def get_patients():
    return jsonify(patients), 200


# POST add a patient
@app.route("/api/patients", methods=["POST"])
def add_patient():
    global id_counter
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = data.get("name", "").strip()
    age = data.get("age")
    condition = data.get("condition", "").strip()

    if not name or not condition:
        return jsonify({"error": "Name and condition are required"}), 400

    try:
        age = int(age)
        if age <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Age must be a valid positive number"}), 400

    patient = {
        "id": id_counter,
        "name": name,
        "age": age,
        "condition": condition,
        "status": "Waiting"
    }
    patients.append(patient)
    id_counter += 1

    return jsonify(patient), 201


# GET single patient
@app.route("/api/patients/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    patient = find_patient(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(patient), 200


# PUT update patient
@app.route("/api/patients/<int:patient_id>", methods=["PUT"])
def update_patient(patient_id):
    patient = find_patient(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if "name" in data:
        patient["name"] = data["name"].strip()
    if "condition" in data:
        patient["condition"] = data["condition"].strip()
    if "age" in data:
        try:
            age = int(data["age"])
            if age <= 0:
                raise ValueError
            patient["age"] = age
        except (ValueError, TypeError):
            return jsonify({"error": "Age must be a valid positive number"}), 400

    return jsonify(patient), 200


# DELETE patient
@app.route("/api/patients/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    patient = find_patient(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    patients.remove(patient)
    return jsonify({"message": "Patient deleted successfully"}), 200


# GET waiting patients
@app.route("/api/patients/waiting", methods=["GET"])
def get_waiting():
    waiting = [p for p in patients if p["status"] == "Waiting"]
    return jsonify(waiting), 200


# GET treated patients
@app.route("/api/patients/treated", methods=["GET"])
def get_treated():
    treated = [p for p in patients if p["status"] == "Treated"]
    return jsonify(treated), 200


# PUT mark as treated
@app.route("/api/patients/<int:patient_id>/treat", methods=["PUT"])
def treat_patient(patient_id):
    patient = find_patient(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    patient["status"] = "Treated"
    return jsonify(patient), 200


if __name__ == "__main__":
    app.run(debug=True)