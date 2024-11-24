package com.google.refine.expr.functions.strings;

import java.text.Normalizer;
import java.util.Properties;

import com.google.refine.expr.EvalError;
import com.google.refine.grel.ControlFunctionRegistry;
import com.google.refine.grel.EvalErrorMessage;
import com.google.refine.grel.Function;

public class NormalizeFunction implements Function {
    
    @Override
    public Object call(Properties bindings, Object[] args) {
        //if the string arg is longer than one string or the arg is not a string return null
        if (args.length != 1 || !(args[0] instanceof String)) { 
            return new EvalError(EvalErrorMessage.expects_one_string(ControlFunctionRegistry.getFunctionName(this)));
        }

        Object input = args[0];
        String normalizedInput = (input instanceof String ? (String) input : input.toString());
        
        return Normalizer.normalize(normalizedInput, Normalizer.Form.NFD)
                 .replaceAll("\\p{M}", "");
    }

    @Override
    public String getDescription() {
        return "Transforms the cells values into its normalization by removing diacritics and normalizing extended western characters to their ASCII representation";
    }

    @Override
    public String getParams() {
        return "string s";
    }

    @Override
    public String getReturns() {
        return "string";
    }
}
