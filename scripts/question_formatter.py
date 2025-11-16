import json

questions = """
[{"question":{"answers":[{"text":"Resilience is defined by the ability to avoid stressors entirely.","is_correct":false},{"text":"Resilience results primarily from innate traits that cannot be taught.","is_correct":false},{"text":"Resilience is a dynamic capacity built through adaptive strategies and supportive systems that enables recovery from disruption.","is_correct":true},{"text":"Communities with clear communication eliminate the need for personal coping.","is_correct":false}],"question":"Which of the following best expresses the main idea of the passage?"}},{"question":{"answers":[{"text":"lessen","is_correct":true},{"text":"delay","is_correct":false},{"text":"store","is_correct":false},{"text":"measure","is_correct":false}],"question":"The word \"buffer\" in the passage is closest in meaning to"}},{"question":{"answers":[{"text":"emotion regulation","is_correct":false},{"text":"cognitive reframing","is_correct":false},{"text":"social support","is_correct":false},{"text":"avoidance","is_correct":true}],"question":"According to the passage, all of the following are mentioned as adaptive processes that support resilience EXCEPT"}},{"question":{"answers":[{"text":"They are as effective as environmental changes on their own.","is_correct":false},{"text":"They may be incomplete because resilience emerges from both personal strategies and supportive contexts.","is_correct":true},{"text":"They will make people invulnerable to future stressors.","is_correct":false},{"text":"They tend to increase avoidance behaviors over time.","is_correct":false}],"question":"What can be inferred about interventions that focus only on strengthening individual coping strategies?"}},{"question":{"answers":[{"text":"It draws a conclusion from earlier points and proposes a dual-target approach to interventions.","is_correct":true},{"text":"It introduces a new research study that contradicts previous claims.","is_correct":false},{"text":"It provides a definition of avoidance as used earlier.","is_correct":false},{"text":"It offers a descriptive example of school communication strategies.","is_correct":false}],"question":"How does the final sentence function in the passage?"}}]
"""

# parse the questions into a list of dictionaries
# Fix escaped quotes - replace \" with \\" so JSON can parse correctly
questions_str = questions.strip().replace('\\"', '')
questions = json.loads(questions_str)


def format_questions(questions_list):
    """Format questions in a human-readable format."""
    formatted_output = []
    
    for idx, item in enumerate(questions_list, 1):
        question_data = item["question"]
        question_text = question_data["question"]
        answers = question_data["answers"]
        
        # Format question header
        formatted_output.append(f"\n{'='*80}")
        formatted_output.append(f"Question {idx}")
        formatted_output.append(f"{'='*80}")
        formatted_output.append(f"\n{question_text}\n")
        
        # Format answers
        formatted_output.append("Answers:")
        for answer_idx, answer in enumerate(answers, 1):
            marker = "✓ (CORRECT)" if answer["is_correct"] else "○"
            formatted_output.append(f"  {marker} {answer_idx}. {answer['text']}")
        
        formatted_output.append("")  # Add spacing between questions
    
    return "\n".join(formatted_output)


# Format and print the questions
formatted_text = format_questions(questions)
print(formatted_text)

