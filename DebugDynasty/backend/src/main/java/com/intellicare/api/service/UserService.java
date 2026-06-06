package com.intellicare.api.service;

import com.intellicare.api.model.*;
import com.intellicare.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private AmbulanceRepository ambulanceRepository;

    @Autowired
    private BloodBankRepository bloodBankRepository;

    @Transactional
    public User registerUser(Map<String, Object> payload) {
        String uid = (String) payload.get("firebaseUid");
        String email = (String) payload.get("email");
        String roleStr = (String) payload.get("role");

        if (uid == null || email == null || roleStr == null) {
            throw new IllegalArgumentException("firebaseUid, email and role are required fields");
        }

        Role role = Role.valueOf(roleStr.toUpperCase());

        // Create base User
        User user = User.builder()
                .firebaseUid(uid)
                .email(email)
                .role(role)
                .build();

        user = userRepository.save(user);

        // Create profile based on role
        switch (role) {
            case PATIENT:
                Patient patient = Patient.builder()
                        .firebaseUid(uid)
                        .user(user)
                        .fullName((String) payload.getOrDefault("fullName", ""))
                        .phone((String) payload.get("phone"))
                        .age(payload.get("age") != null ? ((Number) payload.get("age")).intValue() : null)
                        .bloodGroup((String) payload.get("bloodGroup"))
                        .build();
                patientRepository.save(patient);
                break;

            case DOCTOR:
                Doctor doctor = Doctor.builder()
                        .firebaseUid(uid)
                        .user(user)
                        .fullName((String) payload.getOrDefault("fullName", ""))
                        .phone((String) payload.get("phone"))
                        .medicalRegistrationNumber((String) payload.getOrDefault("medicalRegistrationNumber", ""))
                        .degreeCertificateUrl((String) payload.get("degreeCertificateUrl"))
                        .experienceYears(payload.get("experienceYears") != null ? ((Number) payload.get("experienceYears")).intValue() : null)
                        .specialization((String) payload.get("specialization"))
                        .preferredLanguage((String) payload.get("preferredLanguage"))
                        .onlineStatus(payload.get("onlineStatus") != null ? (Boolean) payload.get("onlineStatus") : true)
                        .build();
                doctorRepository.save(doctor);
                break;

            case HOSPITAL:
                Hospital hospital = Hospital.builder()
                        .firebaseUid(uid)
                        .user(user)
                        .hospitalName((String) payload.getOrDefault("hospitalName", ""))
                        .registrationNumber((String) payload.getOrDefault("registrationNumber", ""))
                        .address((String) payload.get("address"))
                        .contactNumber((String) payload.get("contactNumber"))
                        .build();
                hospitalRepository.save(hospital);
                break;

            case AMBULANCE:
                Ambulance ambulance = Ambulance.builder()
                        .firebaseUid(uid)
                        .user(user)
                        .providerName((String) payload.getOrDefault("providerName", ""))
                        .vehicleNumber((String) payload.getOrDefault("vehicleNumber", ""))
                        .driverName((String) payload.get("driverName"))
                        .contactNumber((String) payload.get("contactNumber"))
                        .build();
                ambulanceRepository.save(ambulance);
                break;

            case BLOOD_BANK:
                BloodBank bloodBank = BloodBank.builder()
                        .firebaseUid(uid)
                        .user(user)
                        .bloodBankName((String) payload.getOrDefault("bloodBankName", ""))
                        .registrationNumber((String) payload.getOrDefault("registrationNumber", ""))
                        .address((String) payload.get("address"))
                        .contactNumber((String) payload.get("contactNumber"))
                        .build();
                bloodBankRepository.save(bloodBank);
                break;
        }

        return user;
    }
}
