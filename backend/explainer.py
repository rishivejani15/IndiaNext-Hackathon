# explainer.py
# Generates human-readable explanations for deepfake detection results


def explain_detection(detection: dict, input_type: str) -> dict:
    """
    Takes the raw detection result and input type ("image" or "video"),
    returns a dict with human-readable explanation fields.
    """
    verdict = detection.get("verdict", "UNKNOWN")
    confidence = detection.get("confidence", 0)
    severity = detection.get("severity", "LOW")

    if input_type == "video":
        return _explain_video(detection, verdict, confidence, severity)
    else:
        return _explain_image(detection, verdict, confidence, severity)


def _explain_image(detection: dict, verdict: str, confidence: float, severity: str) -> dict:
    fake_prob = detection.get("fake_probability", 0)
    real_prob = detection.get("real_probability", 0)

    if verdict == "DEEPFAKE":
        summary = (
            f"This image is classified as a DEEPFAKE with {confidence}% confidence. "
            f"The model detected synthetic artifacts indicating AI-generated or manipulated content."
        )
        details = _get_fake_image_details(fake_prob, severity)
        recommendation = _get_recommendation(severity)
    else:
        summary = (
            f"This image appears AUTHENTIC with {confidence}% confidence. "
            f"No significant signs of AI manipulation were detected."
        )
        details = (
            f"The authenticity probability is {real_prob}%, while the deepfake "
            f"probability is only {fake_prob}%. The image shows natural characteristics "
            f"consistent with a real photograph."
        )
        recommendation = "No action needed. The image appears to be genuine."

    return {
        "explanation": summary,
        "details": details,
        "recommendation": recommendation,
        "risk_level": severity,
    }


def _explain_video(detection: dict, verdict: str, confidence: float, severity: str) -> dict:
    frames_analyzed = detection.get("frames_analyzed", 0)
    fake_frames = detection.get("fake_frames_count", 0)
    real_frames = detection.get("real_frames_count", 0)
    fake_ratio = detection.get("fake_ratio_percent", 0)
    duration = detection.get("duration_seconds", 0)
    worst_ts = detection.get("most_suspicious_timestamp", 0)

    if verdict == "DEEPFAKE":
        summary = (
            f"This video is classified as a DEEPFAKE with {confidence}% average confidence. "
            f"{fake_frames} out of {frames_analyzed} sampled frames show signs of manipulation "
            f"({fake_ratio}% fake ratio)."
        )
        details = (
            f"Frame-by-frame analysis of {duration}s video detected deepfake artifacts in "
            f"{fake_frames} frames. The most suspicious content appears at timestamp "
            f"{worst_ts}s. Severity: {severity}."
        )
        recommendation = _get_recommendation(severity)
    else:
        summary = (
            f"This video appears AUTHENTIC with {confidence}% average confidence. "
            f"{real_frames} out of {frames_analyzed} sampled frames appear genuine."
        )
        details = (
            f"Frame-by-frame analysis of {duration}s video found no significant evidence "
            f"of manipulation. Only {fake_ratio}% of frames triggered any deepfake indicators, "
            f"which is below the detection threshold."
        )
        recommendation = "No action needed. The video appears to be genuine."

    return {
        "explanation": summary,
        "details": details,
        "recommendation": recommendation,
        "risk_level": severity,
        "analysis_summary": {
            "frames_analyzed": frames_analyzed,
            "fake_frames": fake_frames,
            "real_frames": real_frames,
            "fake_ratio_percent": fake_ratio,
            "most_suspicious_timestamp": worst_ts,
        },
    }


def _get_fake_image_details(fake_prob: float, severity: str) -> str:
    base = (
        f"The deepfake probability is {fake_prob}%. "
        f"Risk severity: {severity}. "
    )

    if severity == "CRITICAL":
        return base + (
            "The model has extremely high confidence this content is AI-generated. "
            "Common indicators include unnatural skin textures, lighting inconsistencies, "
            "and boundary artifacts around facial features."
        )
    elif severity == "HIGH":
        return base + (
            "Strong indicators of synthetic manipulation were detected. "
            "Potential signs include warping near the face boundary, irregular eye reflections, "
            "or blending artifacts."
        )
    elif severity == "MEDIUM":
        return base + (
            "Moderate indicators of possible manipulation were found. "
            "The image may have been partially edited or filtered with AI tools."
        )
    else:
        return base + (
            "Minor indicators were flagged but the confidence is relatively low. "
            "This could be a false positive caused by heavy compression or filters."
        )


def _get_recommendation(severity: str) -> str:
    recommendations = {
        "CRITICAL": (
            "URGENT: Do not trust or share this content. This is almost certainly "
            "AI-generated or heavily manipulated. Report to the relevant platform."
        ),
        "HIGH": (
            "WARNING: Exercise extreme caution. This content shows strong signs of "
            "manipulation. Verify through alternative sources before trusting."
        ),
        "MEDIUM": (
            "CAUTION: This content may be manipulated. Cross-reference with other "
            "sources and consider the context before drawing conclusions."
        ),
        "LOW": (
            "Low risk detected, but some minor flags were raised. "
            "The content is likely genuine but verify if used in critical contexts."
        ),
    }
    return recommendations.get(severity, recommendations["LOW"])
